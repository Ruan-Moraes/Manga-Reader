package com.mangareader.translationgateway.application;

import static com.mangareader.translationgateway.domain.GatewayErrorCode.CONSENT_REQUIRED;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.INVALID_REQUEST;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.PAYLOAD_TOO_LARGE;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.UNSUPPORTED_PAIR;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.application.port.ObjectStoragePort;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.ProcessingJob;
import com.mangareader.translationgateway.application.config.GatewayProperties;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

@Service
public class SubmitPageUseCase {
    private final GetCapabilitiesUseCase capabilitiesUseCase;
    private final MediaInspectionService mediaInspector;
    private final ObjectStoragePort storage;
    private final ReserveJobUseCase reservation;
    private final DispatchPendingJobsUseCase dispatcher;
    private final GatewayProperties properties;
    private final Clock clock;

    public SubmitPageUseCase(GetCapabilitiesUseCase capabilitiesUseCase, MediaInspectionService mediaInspector,
                             ObjectStoragePort storage, ReserveJobUseCase reservation, DispatchPendingJobsUseCase dispatcher,
                             GatewayProperties properties, Clock clock) {
        this.capabilitiesUseCase = capabilitiesUseCase;
        this.mediaInspector = mediaInspector;
        this.storage = storage;
        this.reservation = reservation;
        this.dispatcher = dispatcher;
        this.properties = properties;
        this.clock = clock;
    }

    public Result execute(UUID installationId, UUID idempotencyKey, Command command, InputStream bytes) {
        capabilitiesUseCase.requireEnabled();
        var capabilities = capabilitiesUseCase.execute();
        validateCommand(command, capabilities);
        var media = mediaInspector.inspect(bytes, capabilities.mediaLimits().maxBytes());
        try {
            validateMedia(command, media, capabilities);
            var fingerprint = fingerprint(command, media);
            var objectKey = "private/originals/" + UUID.randomUUID();
            var now = Instant.now(clock);
            storage.store(objectKey, media.path(), media.mimeType(), media.sha256(), now);
            try {
                var candidate = new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), installationId,
                    idempotencyKey, command.attemptRef(), command.disclosureVersion(), command.sourceLanguage(),
                    command.targetLanguage(), media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(),
                    objectKey, media.sha256(), fingerprint, now,
                    now.plusSeconds(properties.getDisclosure().getMetadataRetentionDays() * 86_400L));
                var result = reservation.execute(candidate);
                if (!result.created()) deleteBestEffort(objectKey);
                if (result.created()) dispatcher.dispatchBestEffort();
                return new Result(result.job(), result.created());
            } catch (RuntimeException error) {
                deleteBestEffort(objectKey);
                throw error;
            }
        } finally {
            mediaInspector.deleteQuietly(media.path());
        }
    }

    private void deleteBestEffort(String objectKey) {
        try { storage.delete(objectKey); } catch (RuntimeException ignored) { }
    }

    private void validateCommand(Command command, CapabilitiesView capabilities) {
        if (command.byteSize() <= 0 || command.widthPx() <= 0 || command.heightPx() <= 0 || command.attemptRef() == null) {
            throw new GatewayException(INVALID_REQUEST, 400, false);
        }
        if (!capabilities.disclosure().version().equals(command.disclosureVersion())) {
            throw new GatewayException(CONSENT_REQUIRED, 400, false);
        }
        if (!GetCapabilitiesUseCase.LANGUAGES.contains(command.sourceLanguage())
            || !GetCapabilitiesUseCase.LANGUAGES.contains(command.targetLanguage())
            || command.sourceLanguage().equals(command.targetLanguage())) {
            throw new GatewayException(UNSUPPORTED_PAIR, 400, false);
        }
        if (!GetCapabilitiesUseCase.MIME_TYPES.contains(command.mimeType())) {
            throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
        }
        var limits = capabilities.mediaLimits();
        if (command.byteSize() > limits.maxBytes() || command.widthPx() > limits.maxWidthPx()
            || command.heightPx() > limits.maxHeightPx() || (long) command.widthPx() * command.heightPx() > limits.maxPixels()) {
            throw new GatewayException(PAYLOAD_TOO_LARGE, 413, false);
        }
    }

    private void validateMedia(Command command, MediaInspectionService.InspectedMedia media, CapabilitiesView capabilities) {
        if (!command.mimeType().equals(media.mimeType())) throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
        if (command.byteSize() != media.byteSize() || command.widthPx() != media.widthPx() || command.heightPx() != media.heightPx()) {
            throw new GatewayException(INVALID_REQUEST, 400, false);
        }
        if (media.widthPx() > capabilities.mediaLimits().maxWidthPx() || media.heightPx() > capabilities.mediaLimits().maxHeightPx()
            || (long) media.widthPx() * media.heightPx() > capabilities.mediaLimits().maxPixels()) {
            throw new GatewayException(PAYLOAD_TOO_LARGE, 413, false);
        }
    }

    private String fingerprint(Command command, MediaInspectionService.InspectedMedia media) {
        var canonical = Stream.of(media.sha256(), media.mimeType(), Long.toString(media.byteSize()),
                Integer.toString(media.widthPx()), Integer.toString(media.heightPx()), command.sourceLanguage(),
                command.targetLanguage(), command.disclosureVersion(), command.attemptRef().toString())
            .map(value -> value.length() + ":" + value)
            .collect(Collectors.joining());
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    public record Command(String mimeType, long byteSize, int widthPx, int heightPx, String sourceLanguage,
                          String targetLanguage, String disclosureVersion, UUID attemptRef) { }
    public record Result(ProcessingJob job, boolean created) { }
}

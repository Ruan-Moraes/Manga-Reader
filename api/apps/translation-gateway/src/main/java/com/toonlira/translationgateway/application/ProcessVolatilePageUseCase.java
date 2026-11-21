package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.*;

import com.toonlira.translationgateway.application.config.ConfiguredTranslationPairs;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.InlineOcrPort;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.application.port.VolatileRenderPort;
import com.toonlira.translationgateway.application.port.VolatileSessionPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** One owned session, including response delivery. No content survives this invocation. */
@Service
public class ProcessVolatilePageUseCase {
    private static final Logger LOG = LoggerFactory.getLogger(ProcessVolatilePageUseCase.class);
    private final Semaphore capacity = new Semaphore(1);
    private final GatewayProperties properties;
    private final VolatileAttemptUseCase attempts;
    private final ObjectProvider<InlineOcrPort> ocr;
    private final ObjectProvider<TranslationPort> translation;
    private final ObjectProvider<VolatileRenderPort> renderer;
    private final OcrManifestService ocrManifests;
    private final TranslationManifestService translationManifests;
    private final RenderManifestService renderManifests;
    private final VolatileSessionPort sessions;
    private final VolatilePagePipeline pipeline;
    /** Without page analysis, chapter memory or review (tests): OCR, grouping, translation and render only. */
    public ProcessVolatilePageUseCase(GatewayProperties properties, VolatileAttemptUseCase attempts,
        ObjectProvider<InlineOcrPort> ocr, ObjectProvider<TranslationPort> translation, ObjectProvider<VolatileRenderPort> renderer,
        OcrManifestService ocrManifests, TranslationManifestService translationManifests, RenderManifestService renderManifests,
        VolatileSessionPort sessions) {
        this(properties, attempts, ocr, translation, renderer, ocrManifests, translationManifests, renderManifests, sessions,
            VolatilePagePipeline.plain(properties));
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ProcessVolatilePageUseCase(GatewayProperties properties, VolatileAttemptUseCase attempts,
        ObjectProvider<InlineOcrPort> ocr, ObjectProvider<TranslationPort> translation, ObjectProvider<VolatileRenderPort> renderer,
        OcrManifestService ocrManifests, TranslationManifestService translationManifests, RenderManifestService renderManifests,
        VolatileSessionPort sessions, VolatilePagePipeline pipeline) {
        this.properties = properties; this.attempts = attempts; this.ocr = ocr; this.translation = translation;
        this.renderer = renderer; this.ocrManifests = ocrManifests; this.translationManifests = translationManifests;
        this.renderManifests = renderManifests;
        this.sessions = sessions;
        this.pipeline = pipeline;
    }

    /**
     * {@code contextRef}: optional opaque chapter reference (a random UUID the client draws per chapter, never a
     * library id). Pages sharing it keep the chapter's names (ChapterMemoryService).
     */
    public record Command(String mimeType, long byteSize, int widthPx, int heightPx,
                          String sourceLanguage, String targetLanguage, String disclosureVersion, UUID contextRef) {
        public Command(String mimeType, long byteSize, int widthPx, int heightPx,
                       String sourceLanguage, String targetLanguage, String disclosureVersion) {
            this(mimeType, byteSize, widthPx, heightPx, sourceLanguage, targetLanguage, disclosureVersion, null);
        }
    }
    @FunctionalInterface public interface Sink {
        void deliver(byte[] manifest, byte[] image, VolatileSessionPort.Fence fence) throws IOException;
        default void cancel() throws IOException { }
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void execute(UUID installation, UUID key, Command command, InputStream input, Sink sink) throws IOException {
        requireEnabled();
        attempts.requireActive(key);
        sessions.execute(fence -> {
            try { executeOwned(installation, key, command, input, sink, fence); }
            catch (IOException error) { throw new GatewayException(INTERNAL_ERROR, 503, false); }
        }, () -> {
            var reader = Thread.ofVirtual().start(() -> { try { input.close(); } catch (IOException ignored) { } });
            var writer = Thread.ofVirtual().start(() -> { try { sink.cancel(); } catch (IOException ignored) { } });
            joinOwned(reader); joinOwned(writer);
        });
    }

    private void executeOwned(UUID installation, UUID key, Command command, InputStream input, Sink sink, VolatileSessionPort.Fence fence) throws IOException {
        var pair = validate(command);
        if (attempts.find(installation, key).isPresent()) throw new GatewayException(JOB_STATE_CONFLICT, 409, false);
        if (!capacity.tryAcquire()) throw new GatewayException(CAPABILITIES_UNAVAILABLE, 503, true);
        byte[] original = null;
        UUID operation = null;
        boolean finished = false;
        boolean delivered = false;
        long started = System.nanoTime();
        try {
            renderer.getObject().requireAvailable();
            // Size is known before allocation. A single extra read rejects dishonest/chunked oversized bodies.
            original = new byte[Math.toIntExact(command.byteSize())];
            int offset = 0;
            while (offset < original.length) {
                fence.checkActive();
                int count = input.read(original, offset, original.length - offset);
                if (count < 0) throw new GatewayException(INVALID_REQUEST, 400, false);
                offset += count;
            }
            if (input.read() != -1) throw new GatewayException(PAYLOAD_TOO_LARGE, 413, false);
            var policy = policy();
            var source = InMemoryMedia.inspect(original, policy);
            if (!source.mimeType().equals(command.mimeType()) || source.widthPx() != command.widthPx()
                || source.heightPx() != command.heightPx()) throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
            fence.checkActive();
            checkInterrupted();
            renderer.getObject().requireAvailable();
            operation = attempts.reserve(installation, key).operationRef();
            LOG.info("volatile-processing operation={} event=reserved inputBytes={}", operation, original.length);
            attempts.requireActive(key);
            var recognizer = ocr.getObject();
            // Reservation/client resolution may have blocked or swallowed interruption.
            fence.checkActive();
            checkInterrupted();
            // Decoded once, in memory, for balloon detection and re-reading; null (WebP) skips both.
            var page = pipeline.decode(original);
            var reading = pipeline.read(recognizer, original, page, source, pair.source(), operation);
            var regions = reading.regions();
            fence.checkActive();
            checkInterrupted();
            var ocrDocument = new OcrManifest("1.0", operation, pair.source(), source.widthPx(), source.heightPx(), regions);
            var encodedOcr = ocrManifests.encode(ocrDocument);
            var hints = pipeline.layout(page, ocrDocument, source.sha256(), encodedOcr.sha256(), reading.detections());
            page = null;
            fence.checkActive();
            checkInterrupted();
            var request = VolatilePagePipeline.request(operation, pair, regions, hints);
            var validator = new TranslationValidator(Set.of(pair));
            validator.validateRequest(request);
            attempts.requireActive(key);
            VolatilePagePipeline.PageTranslation translatedPage;
            if (regions.isEmpty()) translatedPage = new VolatilePagePipeline.PageTranslation(new TranslationResponse(List.of()), List.of());
            else {
                var translator = translation.getObject();
                // Validate ownership again after preparation and resolution, immediately before the paid stage.
                fence.checkActive();
                checkInterrupted();
                translatedPage = pipeline.translate(translator, new ChapterMemoryService.Chapter(installation, command.contextRef()), request);
            }
            fence.checkActive();
            checkInterrupted();
            var translated = validator.validateResponse(request, translatedPage.response());
            var terms = translatedPage.terms();
            var encodedTranslation = translationManifests.encode(translated, encodedOcr.sha256(), terms);
            var renderRequest = pipeline.renderHints(RenderRequest.create(source, ocrDocument, translated, encodedOcr.sha256(),
                encodedTranslation.sha256(), policy), hints, pair.source());
            var renderEngine = renderer.getObject();
            fence.checkActive();
            checkInterrupted();
            try (var result = renderEngine.render(original, renderRequest)) {
                fence.checkActive();
                checkInterrupted();
                var encoded = renderManifests.encode(result.manifest(), policy, terms);
                var manifest = encoded.bytes();
                try {
                    // Commit uncertainty closes this attempt permanently; it never authorizes provider replay.
                    attempts.finish(operation, VolatileAttemptRepository.Status.FINISHED, null);
                    finished = true;
                    LOG.info("volatile-processing operation={} event=produced outputBytes={} manifestBytes={}", operation, result.image().length, manifest.length);
                    fence.checkActive();
                    sink.deliver(manifest, result.image(), fence);
                    delivered = true;
                } finally { Arrays.fill(manifest, (byte) 0); }
            }
        } catch (IOException | RuntimeException error) {
            if (operation != null && !finished) {
                var code = sanitizedFailure(error);
                LOG.warn("volatile-processing operation={} event=failed errorCode={}", operation, code.value());
                try { attempts.finish(operation, VolatileAttemptRepository.Status.FAILED, code.value()); }
                catch (RuntimeException uncertain) { /* STARTED remains a durable barrier against paid replay. */ }
            }
            if (error instanceof IOException io) throw io;
            if (error instanceof GatewayException known) throw known;
            if (error instanceof TranslationValidationException invalid)
                throw new GatewayException(translationFailure(invalid), 422, false);
            if (operation == null && error instanceof RenderValidationException)
                throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
            throw new GatewayException(INTERNAL_ERROR, 503, false);
        } finally {
            if (original != null) Arrays.fill(original, (byte) 0);
            if (operation != null) LOG.info("volatile-processing operation={} event=closed outcome={} elapsedMs={}", operation,
                delivered ? "response-written" : finished ? "delivery-unconfirmed" : "failed-or-unknown", (System.nanoTime() - started) / 1_000_000);
            capacity.release();
        }
    }

    public void requireEnabled() {
        if (!properties.isEnabled() || !properties.isVolatileProcessingEnabled()) throw new GatewayException(GATEWAY_DISABLED, 503, false);
        VolatileGatewayPolicy.validate(properties);
    }
    public RenderPolicy policy() {
        var initial = RenderPolicy.initial(); var media = properties.getMedia();
        return new RenderPolicy(initial.version(), Math.min(media.getMaxBytes(), initial.maxOriginalBytes()),
            Math.min(media.getMaxWidthPx(), initial.maxWidthPx()), Math.min(media.getMaxHeightPx(), initial.maxHeightPx()),
            Math.min(media.getMaxPixels(), initial.maxPixels()), initial.maxOutputBytes(), initial.maxManifestBytes(),
            initial.minimumFontPx(), initial.maximumFontPx(), initial.paddingPx());
    }
    /** The pair, when this gateway translates it; otherwise unsupported-pair (422). */
    public LanguagePair requirePair(String sourceLanguage, String targetLanguage) {
        try {
            var pair = new LanguagePair(sourceLanguage, targetLanguage);
            if (!ConfiguredTranslationPairs.parse(properties.getTranslation().getEnabledPairs()).contains(pair))
                throw new GatewayException(UNSUPPORTED_PAIR, 422, false);
            return pair;
        } catch (TranslationValidationException invalid) { throw new GatewayException(UNSUPPORTED_PAIR, 422, false); }
    }

    private LanguagePair validate(Command command) {
        if (command == null || command.byteSize() <= 0 || command.byteSize() > policy().maxOriginalBytes()
            || command.widthPx() <= 0 || command.heightPx() <= 0 || command.widthPx() > policy().maxWidthPx()
            || command.heightPx() > policy().maxHeightPx() || (long) command.widthPx() * command.heightPx() > policy().maxPixels())
            throw new GatewayException(PAYLOAD_TOO_LARGE, 413, false);
        if (properties.getDisclosure().getVersion().isBlank()
            || !properties.getDisclosure().getVersion().equals(command.disclosureVersion())) throw new GatewayException(CONSENT_REQUIRED, 409, false);
        try {
            var pair = new LanguagePair(command.sourceLanguage(), command.targetLanguage());
            if (!ConfiguredTranslationPairs.parse(properties.getTranslation().getEnabledPairs()).contains(pair))
                throw new GatewayException(UNSUPPORTED_PAIR, 422, false);
            return pair;
        } catch (TranslationValidationException invalid) { throw new GatewayException(UNSUPPORTED_PAIR, 422, false); }
    }
    private static void joinOwned(Thread thread) {
        boolean interrupted = Thread.interrupted();
        while (thread.isAlive()) {
            try { thread.join(); } catch (InterruptedException ignored) { interrupted = true; }
        }
        if (interrupted) Thread.currentThread().interrupt();
    }
    private static void checkInterrupted() {
        if (Thread.currentThread().isInterrupted()) throw new GatewayException(INTERNAL_ERROR, 503, false);
    }
    private static GatewayErrorCode sanitizedFailure(Exception error) {
        if (error instanceof TranslationValidationException invalid) return translationFailure(invalid);
        if (error instanceof GatewayException known && Set.of(OCR_UNAVAILABLE, OCR_INVALID_RESPONSE,
            TRANSLATION_UNAVAILABLE, TRANSLATION_INVALID_REQUEST, TRANSLATION_INVALID_RESPONSE).contains(known.code())) return known.code();
        return INTERNAL_ERROR;
    }
    private static GatewayErrorCode translationFailure(TranslationValidationException error) {
        return error.failure() == TranslationValidationException.Failure.INVALID_OUTPUT ? TRANSLATION_INVALID_RESPONSE : TRANSLATION_INVALID_REQUEST;
    }
}

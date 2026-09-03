package com.mangareader.translationgateway.presentation;

import static com.mangareader.translationgateway.domain.GatewayErrorCode.JOB_STATE_CONFLICT;

import com.mangareader.translationgateway.application.CancelJobUseCase;
import com.mangareader.translationgateway.application.CapabilitiesView;
import com.mangareader.translationgateway.application.CreateInstallationUseCase;
import com.mangareader.translationgateway.application.CreateSessionUseCase;
import com.mangareader.translationgateway.application.GetCapabilitiesUseCase;
import com.mangareader.translationgateway.application.GetJobUseCase;
import com.mangareader.translationgateway.application.SubmitPageUseCase;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.JobStatus;
import com.mangareader.translationgateway.domain.ProcessingJob;
import com.mangareader.translationgateway.infrastructure.security.SessionAuthenticationFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1")
public class GatewayController {
    private final GetCapabilitiesUseCase getCapabilities;
    private final CreateInstallationUseCase createInstallation;
    private final CreateSessionUseCase createSession;
    private final SubmitPageUseCase submitPage;
    private final GetJobUseCase getJob;
    private final CancelJobUseCase cancelJob;

    public GatewayController(GetCapabilitiesUseCase getCapabilities, CreateInstallationUseCase createInstallation,
                             CreateSessionUseCase createSession, SubmitPageUseCase submitPage,
                             GetJobUseCase getJob, CancelJobUseCase cancelJob) {
        this.getCapabilities = getCapabilities;
        this.createInstallation = createInstallation;
        this.createSession = createSession;
        this.submitPage = submitPage;
        this.getJob = getJob;
        this.cancelJob = cancelJob;
    }

    @GetMapping("/capabilities")
    ResponseEntity<CapabilitiesView> capabilities(
        @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        var result = getCapabilities.execute();
        var cacheControl = CacheControl.maxAge(java.time.Duration.between(result.generatedAt(), result.validUntil()))
            .cachePrivate().mustRevalidate();
        if (result.etag().equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(result.etag()).cacheControl(cacheControl).build();
        }
        return ResponseEntity.ok().eTag(result.etag())
            .cacheControl(cacheControl).body(result);
    }

    @PostMapping("/anonymous/installations")
    ResponseEntity<InstallationCreated> installation() {
        var result = createInstallation.execute();
        return ResponseEntity.status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore())
            .body(new InstallationCreated("1.0", result.installationRef(), result.credential(), result.createdAt()));
    }

    @PostMapping("/anonymous/sessions")
    ResponseEntity<SessionCreated> session(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                           @Valid @RequestBody SessionRequest request) {
        var credential = SessionAuthenticationFilter.bearer(authorization);
        if (credential == null) throw new GatewayException(com.mangareader.translationgateway.domain.GatewayErrorCode.UNAUTHORIZED, 401, false);
        var result = createSession.execute(request.installationRef(), credential);
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
            .body(new SessionCreated("1.0", result.accessToken(), result.expiresAt()));
    }

    @PostMapping(path = "/page-jobs", consumes = "multipart/form-data")
    ResponseEntity<JobEnvelope> submit(Authentication authentication,
                                       @RequestHeader("Idempotency-Key") UUID idempotencyKey,
                                       @RequestParam("page") MultipartFile page,
                                       @RequestParam String mimeType,
                                       @RequestParam long byteSize,
                                       @RequestParam int widthPx,
                                       @RequestParam int heightPx,
                                       @RequestParam String sourceLanguage,
                                       @RequestParam String targetLanguage,
                                       @RequestParam String disclosureVersion,
                                       @RequestParam UUID attemptRef) throws IOException {
        if (page.getContentType() != null && !page.getContentType().equals(mimeType)) {
            throw new GatewayException(
                com.mangareader.translationgateway.domain.GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE, 415, false);
        }
        var command = new SubmitPageUseCase.Command(mimeType, byteSize, widthPx, heightPx, sourceLanguage,
            targetLanguage, disclosureVersion, attemptRef);
        try (var input = page.getInputStream()) {
            var result = submitPage.execute(installationId(authentication), idempotencyKey, command, input);
            return ResponseEntity.accepted().body(envelope(result.job()));
        }
    }

    @GetMapping("/page-jobs/by-idempotency/{idempotencyKey}")
    JobEnvelope byIdempotency(Authentication authentication, @PathVariable UUID idempotencyKey) {
        return envelope(getJob.byIdempotency(installationId(authentication), idempotencyKey));
    }

    @GetMapping("/page-jobs/{jobRef}")
    JobEnvelope byRef(Authentication authentication, @PathVariable UUID jobRef) {
        return envelope(getJob.byRef(installationId(authentication), jobRef));
    }

    @PostMapping("/page-jobs/{jobRef}/cancel")
    ResponseEntity<JobEnvelope> cancel(Authentication authentication, @PathVariable UUID jobRef) {
        var result = cancelJob.execute(installationId(authentication), jobRef);
        var status = result.status() == JobStatus.CANCELLED ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(envelope(result));
    }

    @PostMapping("/page-jobs/{jobRef}/ack")
    ResponseEntity<Void> acknowledge(Authentication authentication, @PathVariable UUID jobRef) {
        getJob.byRef(installationId(authentication), jobRef);
        throw new GatewayException(JOB_STATE_CONFLICT, 409, false);
    }

    private UUID installationId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }

    private JobEnvelope envelope(ProcessingJob job) {
        JobError error = job.errorCode() == null ? null : new JobError(job.errorCode(), false);
        return new JobEnvelope("1.0", job.jobRef(), job.status().name(), job.serverTime(), error);
    }

    public record InstallationCreated(String contractVersion, UUID installationRef, String credential, Instant createdAt) { }
    public record SessionRequest(@NotNull UUID installationRef) { }
    public record SessionCreated(String contractVersion, String accessToken, Instant expiresAt) { }
    public record JobEnvelope(String contractVersion, UUID jobRef, String status, Instant serverTime, JobError error) { }
    public record JobError(String code, boolean retryable) { }
}

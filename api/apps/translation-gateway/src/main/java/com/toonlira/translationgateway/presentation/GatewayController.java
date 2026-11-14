package com.toonlira.translationgateway.presentation;

import com.toonlira.translationgateway.application.AcknowledgeResultUseCase;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.CapabilitiesView;
import com.toonlira.translationgateway.application.CreateInstallationUseCase;
import com.toonlira.translationgateway.application.CreateSessionUseCase;
import com.toonlira.translationgateway.application.GetCapabilitiesUseCase;
import com.toonlira.translationgateway.application.GetJobResultUseCase;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import com.toonlira.translationgateway.application.SubmitPageUseCase;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.infrastructure.security.SessionAuthenticationFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.context.annotation.Profile;
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
@Profile("!worker")
@RequestMapping("/v1")
@Tag(name = "Gateway", description = "API privada do gateway de processamento de páginas")
public class GatewayController {
    private final GetCapabilitiesUseCase getCapabilities;
    private final CreateInstallationUseCase createInstallation;
    private final CreateSessionUseCase createSession;
    private final SubmitPageUseCase submitPage;
    private final GetJobResultUseCase getJob;
    private final CancelJobUseCase cancelJob;
    private final AcknowledgeResultUseCase acknowledgeResult;

    public GatewayController(GetCapabilitiesUseCase getCapabilities, CreateInstallationUseCase createInstallation,
                             CreateSessionUseCase createSession, SubmitPageUseCase submitPage,
                             GetJobResultUseCase getJob, CancelJobUseCase cancelJob,
                             AcknowledgeResultUseCase acknowledgeResult) {
        this.getCapabilities = getCapabilities;
        this.createInstallation = createInstallation;
        this.createSession = createSession;
        this.submitPage = submitPage;
        this.getJob = getJob;
        this.cancelJob = cancelJob;
        this.acknowledgeResult = acknowledgeResult;
    }

    @GetMapping("/capabilities")
    @Operation(
        summary = "Obter capacidades disponíveis do gateway",
        description = "Retorna as capacidades e modos de processamento disponíveis (OCR, Tradução, Layout, Renderização)"
    )
    @ApiResponse(responseCode = "200", description = "Capacidades retornadas com sucesso")
    @ApiResponse(responseCode = "304", description = "Recurso não modificado (ETag match)")
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
    @Operation(
        summary = "Criar nova instalação",
        description = "Cria uma nova instalação anônima e retorna referência de instalação e credencial de autenticação"
    )
    @ApiResponse(responseCode = "201", description = "Instalação criada com sucesso")
    ResponseEntity<InstallationCreated> installation() {
        var result = createInstallation.execute();
        return ResponseEntity.status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore())
            .body(new InstallationCreated("1.0", result.installationRef(), result.credential(), result.createdAt()));
    }

    @PostMapping("/anonymous/sessions")
    @Operation(
        summary = "Criar nova sessão autenticada",
        description = "Cria uma nova sessão autenticada usando referência de instalação e credencial"
    )
    @ApiResponse(responseCode = "201", description = "Sessão criada com sucesso")
    @ApiResponse(responseCode = "401", description = "Credencial inválida ou ausente")
    ResponseEntity<SessionCreated> session(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                           @Valid @RequestBody SessionRequest request) {
        var credential = SessionAuthenticationFilter.bearer(authorization);
        if (credential == null) throw new GatewayException(com.toonlira.translationgateway.domain.GatewayErrorCode.UNAUTHORIZED, 401, false);
        var result = createSession.execute(request.installationRef(), credential);
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
            .body(new SessionCreated("1.0", result.accessToken(), result.expiresAt()));
    }

    @PostMapping(path = "/page-jobs", consumes = "multipart/form-data")
    @Operation(
        summary = "Submeter página para processamento",
        description = "Envia uma página (imagem) para processamento com tradução, OCR e/ou renderização. Retorna jobRef para acompanhar o progresso"
    )
    @ApiResponse(responseCode = "202", description = "Página aceita para processamento")
    @ApiResponse(responseCode = "415", description = "Tipo de mídia não suportado")
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
                com.toonlira.translationgateway.domain.GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE, 415, false);
        }
        var command = new SubmitPageUseCase.Command(mimeType, byteSize, widthPx, heightPx, sourceLanguage,
            targetLanguage, disclosureVersion, attemptRef);
        try (var input = page.getInputStream()) {
            var result = submitPage.execute(installationId(authentication), idempotencyKey, command, input);
            return ResponseEntity.accepted().body(envelope(result.job()));
        }
    }

    @GetMapping("/page-jobs/by-idempotency/{idempotencyKey}")
    @Operation(
        summary = "Obter job por Idempotency-Key",
        description = "Recupera status e resultado do job usando a chave de idempotência enviada durante a submissão"
    )
    @ApiResponse(responseCode = "200", description = "Job encontrado e retornado")
    ResponseEntity<JobEnvelope> byIdempotency(Authentication authentication, @PathVariable UUID idempotencyKey) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(envelope(getJob.byIdempotency(installationId(authentication), idempotencyKey)));
    }

    @GetMapping("/page-jobs/{jobRef}")
    @Operation(
        summary = "Obter job por referência",
        description = "Recupera status e resultado do job usando a referência única retornada na submissão"
    )
    @ApiResponse(responseCode = "200", description = "Job encontrado e retornado")
    ResponseEntity<JobEnvelope> byRef(Authentication authentication, @PathVariable UUID jobRef) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(envelope(getJob.byRef(installationId(authentication), jobRef)));
    }

    @PostMapping("/page-jobs/{jobRef}/cancel")
    @Operation(
        summary = "Cancelar job em andamento",
        description = "Tenta cancelar um job que está sendo processado"
    )
    @ApiResponse(responseCode = "200", description = "Job já foi cancelado")
    @ApiResponse(responseCode = "202", description = "Cancelamento aceito, job será cancelado em breve")
    ResponseEntity<JobEnvelope> cancel(Authentication authentication, @PathVariable UUID jobRef) {
        var result = cancelJob.execute(installationId(authentication), jobRef);
        var status = result.status() == JobStatus.CANCELLED ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(envelope(result));
    }

    @PostMapping("/page-jobs/{jobRef}/ack")
    @Operation(
        summary = "Confirmar recebimento do resultado",
        description = "Confirma que o cliente recebeu o resultado, permitindo limpeza de dados no servidor"
    )
    @ApiResponse(responseCode = "202", description = "Confirmação aceita")
    ResponseEntity<Void> acknowledge(Authentication authentication, @PathVariable UUID jobRef) {
        acknowledgeResult.execute(installationId(authentication), jobRef);
        return ResponseEntity.accepted().build();
    }

    private UUID installationId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }

    private JobEnvelope envelope(ProcessingJob job) {
        JobError error = job.errorCode() == null ? null : new JobError(job.errorCode(), false);
        return new JobEnvelope("1.0", job.jobRef(), job.status().name(), job.serverTime(), error, null);
    }

    private JobEnvelope envelope(GetJobResultUseCase.Result query) {
        var job = query.job();
        var result = query.result();
        var body = result == null ? null : new ReadyResult("1.0", result.widthPx(), result.heightPx(), result.expiresAt(),
            download(result.image()), download(result.manifest()));
        return new JobEnvelope("1.0", job.jobRef(), job.status().name(), query.serverTime(),
            job.errorCode() == null ? null : new JobError(job.errorCode(), false), body);
    }

    private Download download(PrivateDownload value) {
        return new Download(value.url(), value.mimeType(), value.byteSize(), value.sha256(), value.expiresAt());
    }

    public record InstallationCreated(String contractVersion, UUID installationRef, String credential, Instant createdAt) { }
    public record SessionRequest(@NotNull UUID installationRef) { }
    public record SessionCreated(String contractVersion, String accessToken, Instant expiresAt) { }
    public record JobEnvelope(String contractVersion, UUID jobRef, String status, Instant serverTime, JobError error,
                              @JsonInclude(JsonInclude.Include.NON_NULL) ReadyResult result) {
        @Override public String toString() { return "JobEnvelope[redacted]"; }
    }
    public record ReadyResult(String manifestVersion, int widthPx, int heightPx, Instant expiresAt, Download image, Download manifest) {
        @Override public String toString() { return "ReadyResult[redacted]"; }
    }
    public record Download(URI url, String mimeType, long byteSize, String sha256, Instant expiresAt) {
        @Override public String toString() { return "Download[redacted]"; }
    }
    public record JobError(String code, boolean retryable) { }
}

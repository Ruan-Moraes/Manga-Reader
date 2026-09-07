package com.toonlira.translationgateway.presentation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.CapabilitiesView;
import com.toonlira.translationgateway.application.AuthenticateSessionUseCase;
import com.toonlira.translationgateway.application.CreateInstallationUseCase;
import com.toonlira.translationgateway.application.CreateSessionUseCase;
import com.toonlira.translationgateway.application.GetCapabilitiesUseCase;
import com.toonlira.translationgateway.application.GetJobUseCase;
import com.toonlira.translationgateway.application.SubmitPageUseCase;
import com.toonlira.translationgateway.domain.DispatchStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;

@WebMvcTest(GatewayController.class)
@AutoConfigureMockMvc(addFilters = false)
class GatewayControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private GetCapabilitiesUseCase getCapabilities;
    @MockitoBean private CreateInstallationUseCase createInstallation;
    @MockitoBean private CreateSessionUseCase createSession;
    @MockitoBean private SubmitPageUseCase submitPage;
    @MockitoBean private GetJobUseCase getJob;
    @MockitoBean private CancelJobUseCase cancelJob;
    @MockitoBean private AuthenticateSessionUseCase authenticateSession;

    private UUID installationId;
    private ProcessingJob job;

    @BeforeEach
    void setUp() {
        installationId = UUID.randomUUID();
        var jobRef = UUID.randomUUID();
        job = new ProcessingJob(UUID.randomUUID(), jobRef, installationId, UUID.randomUUID(), UUID.randomUUID(), "a".repeat(64),
            JobStatus.QUEUED, DispatchStatus.PENDING, null, Instant.parse("2026-09-02T12:00:00Z"));
    }

    @Test
    void shouldExposeCapabilitiesWithEtagOutsideTheBody() throws Exception {
        var disclosure = new CapabilitiesView.LegalDisclosure("privacy-1", "Toonlira", "privacy@example.com",
            "https://example.com/privacy", "https://example.com/terms", "southamerica-east1", List.of("us", "us-central1"),
            3600, 3600, 7, "No training");
        when(getCapabilities.execute()).thenReturn(new CapabilitiesView("1.0", "toonlira-alpha", job.serverTime(),
            job.serverTime().plusSeconds(300), false, List.of("ja", "pt-BR"),
            List.of(new CapabilitiesView.LanguagePair("ja", "pt-BR")),
            new CapabilitiesView.MediaLimits(List.of("image/png"), 1000, 100, 100, 10000), 20, 100, disclosure, "\"etag\""));

        mockMvc.perform(get("/v1/capabilities"))
            .andExpect(status().isOk()).andExpect(header().string(HttpHeaders.ETAG, "\"etag\""))
            .andExpect(jsonPath("$.etag").doesNotExist()).andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(get("/v1/capabilities").header(HttpHeaders.IF_NONE_MATCH, "\"etag\""))
            .andExpect(status().isNotModified()).andExpect(header().string(HttpHeaders.ETAG, "\"etag\""));
    }

    @Test
    void shouldCreateInstallationAndSession() throws Exception {
        when(createInstallation.execute()).thenReturn(new CreateInstallationUseCase.Result(installationId, "c".repeat(43), job.serverTime()));
        when(createSession.execute(any(), any())).thenReturn(new CreateSessionUseCase.Result("s".repeat(43), job.serverTime().plusSeconds(900)));

        mockMvc.perform(post("/v1/anonymous/installations"))
            .andExpect(status().isCreated()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
            .andExpect(jsonPath("$.installationRef").value(installationId.toString()));
        mockMvc.perform(post("/v1/anonymous/sessions").header(HttpHeaders.AUTHORIZATION, "Bearer " + "c".repeat(43))
                .contentType("application/json").content("{\"installationRef\":\"" + installationId + "\"}"))
            .andExpect(status().isCreated()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
            .andExpect(jsonPath("$.accessToken").value("s".repeat(43)));
    }

    @Test
    void shouldReturnProblemWhenInstallationCredentialIsMissingOrJsonIsMalformed() throws Exception {
        mockMvc.perform(post("/v1/anonymous/sessions")
                .contentType("application/json").content("{\"installationRef\":\"" + installationId + "\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("unauthorized"));

        mockMvc.perform(post("/v1/anonymous/sessions").header(HttpHeaders.AUTHORIZATION, "Bearer credential")
                .contentType("application/json").content("{"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid-request"));

        mockMvc.perform(post("/v1/anonymous/sessions").header(HttpHeaders.AUTHORIZATION, "Bearer credential")
                .contentType("application/json")
                .content("{\"installationRef\":\"" + installationId + "\",\"unexpected\":true}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid-request"));
    }

    @Test
    void shouldReturnProblemForUnsupportedSubmissionContentType() throws Exception {
        var authentication = new UsernamePasswordAuthenticationToken(installationId, null, List.of());

        mockMvc.perform(post("/v1/page-jobs").principal(authentication).contentType("application/json").content("{}"))
            .andExpect(status().isUnsupportedMediaType())
            .andExpect(jsonPath("$.code").value("unsupported-media-type"));
    }

    @Test
    void shouldExposeSubmissionLookupCancellationAndAckConflict() throws Exception {
        var authentication = new UsernamePasswordAuthenticationToken(installationId, null, List.of());
        when(getJob.byRef(installationId, job.jobRef())).thenReturn(job);
        when(getJob.byIdempotency(installationId, job.idempotencyKey())).thenReturn(job);
        var cancelled = new ProcessingJob(job.id(), job.jobRef(), installationId, job.idempotencyKey(), job.attemptRef(), job.requestFingerprint(),
            JobStatus.CANCELLED, DispatchStatus.CANCELLED, null, job.serverTime());
        when(cancelJob.execute(installationId, job.jobRef())).thenReturn(cancelled);

        mockMvc.perform(get("/v1/page-jobs/{jobRef}", job.jobRef()).principal(authentication))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("QUEUED"));
        mockMvc.perform(get("/v1/page-jobs/by-idempotency/{key}", job.idempotencyKey()).principal(authentication))
            .andExpect(status().isOk()).andExpect(jsonPath("$.jobRef").value(job.jobRef().toString()));
        mockMvc.perform(post("/v1/page-jobs/{jobRef}/cancel", job.jobRef()).principal(authentication))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        mockMvc.perform(post("/v1/page-jobs/{jobRef}/ack", job.jobRef()).principal(authentication))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("job-state-conflict"));
    }

    @Test
    void shouldAcceptMultipartSubmission() throws Exception {
        var authentication = new UsernamePasswordAuthenticationToken(installationId, null, List.of());
        when(submitPage.execute(any(), any(), any(), any())).thenReturn(new SubmitPageUseCase.Result(job, true));
        var page = new MockMultipartFile("page", "ignored.png", "image/png", new byte[32]);

        mockMvc.perform(multipart("/v1/page-jobs").file(page).principal(authentication)
                .header("Idempotency-Key", job.idempotencyKey())
                .param("mimeType", "image/png").param("byteSize", "32").param("widthPx", "1").param("heightPx", "1")
                .param("sourceLanguage", "ja").param("targetLanguage", "pt-BR").param("disclosureVersion", "privacy-1")
                .param("attemptRef", job.attemptRef().toString()))
            .andExpect(status().isAccepted()).andExpect(jsonPath("$.jobRef").value(job.jobRef().toString()));
    }

    @Test
    void shouldRejectDivergentMultipartAndDeclaredMimeTypes() throws Exception {
        var authentication = new UsernamePasswordAuthenticationToken(installationId, null, List.of());
        var page = new MockMultipartFile("page", "ignored.png", "image/jpeg", new byte[32]);

        mockMvc.perform(multipart("/v1/page-jobs").file(page).principal(authentication)
                .header("Idempotency-Key", job.idempotencyKey())
                .param("mimeType", "image/png").param("byteSize", "32").param("widthPx", "1").param("heightPx", "1")
                .param("sourceLanguage", "ja").param("targetLanguage", "pt-BR").param("disclosureVersion", "privacy-1")
                .param("attemptRef", job.attemptRef().toString()))
            .andExpect(status().isUnsupportedMediaType())
            .andExpect(jsonPath("$.code").value("unsupported-media-type"));
    }

    @Test
    void shouldExposeFailClosedAndForbiddenErrorsAsProblemDetails() throws Exception {
        when(getCapabilities.execute())
            .thenThrow(new GatewayException(GatewayErrorCode.CAPABILITIES_UNAVAILABLE, 503, true));
        mockMvc.perform(get("/v1/capabilities"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/problem+json"))
            .andExpect(jsonPath("$.code").value("capabilities-unavailable"));

        when(createSession.execute(any(), any()))
            .thenThrow(new GatewayException(GatewayErrorCode.INSTALLATION_REVOKED, 403, false));
        mockMvc.perform(post("/v1/anonymous/sessions").header(HttpHeaders.AUTHORIZATION, "Bearer " + "c".repeat(43))
                .contentType("application/json").content("{\"installationRef\":\"" + installationId + "\"}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("installation-revoked"));
    }

    @Test
    void shouldExposeQuotaAndPayloadLimitsAsProblemDetails() throws Exception {
        var authentication = new UsernamePasswordAuthenticationToken(installationId, null, List.of());
        doThrow(new GatewayException(GatewayErrorCode.QUOTA_EXCEEDED, 429, true))
            .when(submitPage).execute(any(), any(), any(), any());
        mockMvc.perform(validSubmission(authentication))
            .andExpect(status().isTooManyRequests()).andExpect(header().string(HttpHeaders.RETRY_AFTER, "86400"))
            .andExpect(jsonPath("$.code").value("quota-exceeded"));

        doThrow(new GatewayException(GatewayErrorCode.PAYLOAD_TOO_LARGE, 413, false))
            .when(submitPage).execute(any(), any(), any(), any());
        mockMvc.perform(validSubmission(authentication))
            .andExpect(status().isPayloadTooLarge()).andExpect(jsonPath("$.code").value("payload-too-large"));
    }

    private RequestBuilder validSubmission(Authentication authentication) {
        var page = new MockMultipartFile("page", "ignored.png", "image/png", new byte[32]);
        return multipart("/v1/page-jobs").file(page).principal(authentication)
            .header("Idempotency-Key", job.idempotencyKey())
            .param("mimeType", "image/png").param("byteSize", "32").param("widthPx", "1").param("heightPx", "1")
            .param("sourceLanguage", "ja").param("targetLanguage", "pt-BR").param("disclosureVersion", "privacy-1")
            .param("attemptRef", job.attemptRef().toString());
    }
}

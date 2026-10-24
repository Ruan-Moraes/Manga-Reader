package com.toonlira.translationgateway.infrastructure.security;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.toonlira.translationgateway.application.AuthenticateSessionUseCase;
import com.toonlira.translationgateway.application.AcknowledgeResultUseCase;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.CreateInstallationUseCase;
import com.toonlira.translationgateway.application.CreateSessionUseCase;
import com.toonlira.translationgateway.application.GetCapabilitiesUseCase;
import com.toonlira.translationgateway.application.GetJobResultUseCase;
import com.toonlira.translationgateway.application.SubmitPageUseCase;
import com.toonlira.translationgateway.domain.DispatchStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.presentation.GatewayController;
import com.toonlira.translationgateway.presentation.GatewayExceptionHandler;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GatewayController.class)
@Import({GatewaySecurityConfig.class, GatewayExceptionHandler.class, SessionAuthenticationFilter.class})
class GatewaySecurityTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private AuthenticateSessionUseCase authenticateSession;
    @MockitoBean private GetCapabilitiesUseCase getCapabilities;
    @MockitoBean private CreateInstallationUseCase createInstallation;
    @MockitoBean private CreateSessionUseCase createSession;
    @MockitoBean private SubmitPageUseCase submitPage;
    @MockitoBean private GetJobResultUseCase getJob;
    @MockitoBean private CancelJobUseCase cancelJob;
    @MockitoBean private AcknowledgeResultUseCase acknowledgeResult;

    @Test
    void shouldRejectAcknowledgementWithoutSessionBeforeDelegating() throws Exception {
        mockMvc.perform(post("/v1/page-jobs/{jobRef}/ack", UUID.randomUUID()))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("unauthorized"));
        verifyNoInteractions(acknowledgeResult);
    }

    @Test
    void shouldScopeAcknowledgementToAuthenticatedInstallationWithoutResponseBody() throws Exception {
        var installationId = UUID.randomUUID();
        var jobRef = UUID.randomUUID();
        var token = "t".repeat(43);
        when(authenticateSession.execute(token)).thenReturn(Optional.of(installationId));

        mockMvc.perform(post("/v1/page-jobs/{jobRef}/ack", jobRef)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isAccepted())
            .andExpect(content().string(""));
        verify(acknowledgeResult).execute(installationId, jobRef);
    }

    @Test
    void unauthenticatedQueriesNeverRequestPrivateDownloads() throws Exception {
        mockMvc.perform(get("/v1/page-jobs/by-idempotency/{key}", UUID.randomUUID()))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/v1/page-jobs/{jobRef}", UUID.randomUUID()))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(getJob);
    }

    @Test
    void anAuthenticatedCrossOwnerLookupReturnsNoArtifact() throws Exception {
        var owner = UUID.randomUUID();
        var ref = UUID.randomUUID();
        var token = "t".repeat(43);
        when(authenticateSession.execute(token)).thenReturn(Optional.of(owner));
        when(getJob.byRef(owner, ref)).thenThrow(new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false));
        mockMvc.perform(get("/v1/page-jobs/{jobRef}", ref).header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.result").doesNotExist())
            .andExpect(jsonPath("$.code").value("job-not-found"));
        verify(getJob).byRef(owner, ref);
    }

    @Test
    void shouldReturnProblemWhenSessionIsMissing() throws Exception {
        mockMvc.perform(get("/v1/page-jobs/{jobRef}", UUID.randomUUID()))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("unauthorized"));
    }

    @Test
    void shouldAuthenticateOpaqueSessionWithoutExposingItInResponse() throws Exception {
        var installationId = UUID.randomUUID();
        var token = "t".repeat(43);
        var jobRef = UUID.randomUUID();
        var job = new ProcessingJob(UUID.randomUUID(), jobRef, installationId, UUID.randomUUID(), UUID.randomUUID(), "a".repeat(64),
            JobStatus.QUEUED, DispatchStatus.PENDING, null, Instant.parse("2026-09-02T12:00:00Z"));
        when(authenticateSession.execute(token)).thenReturn(Optional.of(installationId));
        when(getJob.byRef(installationId, jobRef)).thenReturn(new GetJobResultUseCase.Result(job, job.serverTime(), null));

        mockMvc.perform(get("/v1/page-jobs/{jobRef}", jobRef).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.jobRef").value(jobRef.toString()))
            .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    @Test
    void shouldReturnProblemWhenAuthenticationStorageIsUnavailable() throws Exception {
        var token = "t".repeat(43);
        when(authenticateSession.execute(token))
            .thenThrow(new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true));

        mockMvc.perform(get("/v1/page-jobs/{jobRef}", UUID.randomUUID())
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.code").value("storage-unavailable"))
            .andExpect(jsonPath("$.retryable").value(true));
    }
}

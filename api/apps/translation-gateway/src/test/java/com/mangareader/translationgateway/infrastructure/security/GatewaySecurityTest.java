package com.mangareader.translationgateway.infrastructure.security;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mangareader.translationgateway.application.AuthenticateSessionUseCase;
import com.mangareader.translationgateway.application.CancelJobUseCase;
import com.mangareader.translationgateway.application.CreateInstallationUseCase;
import com.mangareader.translationgateway.application.CreateSessionUseCase;
import com.mangareader.translationgateway.application.GetCapabilitiesUseCase;
import com.mangareader.translationgateway.application.GetJobUseCase;
import com.mangareader.translationgateway.application.SubmitPageUseCase;
import com.mangareader.translationgateway.domain.DispatchStatus;
import com.mangareader.translationgateway.domain.GatewayErrorCode;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.JobStatus;
import com.mangareader.translationgateway.domain.ProcessingJob;
import com.mangareader.translationgateway.presentation.GatewayController;
import com.mangareader.translationgateway.presentation.GatewayExceptionHandler;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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
    @MockitoBean private GetJobUseCase getJob;
    @MockitoBean private CancelJobUseCase cancelJob;

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
        when(getJob.byRef(installationId, jobRef)).thenReturn(job);

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

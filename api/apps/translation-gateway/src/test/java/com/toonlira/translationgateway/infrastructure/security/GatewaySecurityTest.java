package com.toonlira.translationgateway.infrastructure.security;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.toonlira.translationgateway.application.AuthenticateSessionUseCase;
import com.toonlira.translationgateway.application.ProcessVolatilePageUseCase;
import com.toonlira.translationgateway.application.VolatileAttemptUseCase;
import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.presentation.VolatileTranslationController;
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

/** Current v2 security replaces the retired v1 URL/download/ACK contract. */
@WebMvcTest(VolatileTranslationController.class)
@Import({GatewaySecurityConfig.class, GatewayExceptionHandler.class, SessionAuthenticationFilter.class})
class GatewaySecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthenticateSessionUseCase authenticate;
    @MockitoBean ProcessVolatilePageUseCase processor;
    @MockitoBean VolatileAttemptUseCase attempts;

    @Test void anonymousUploadAndReceiptQueryAreRejectedBeforeReadingContent() throws Exception {
        mvc.perform(post("/v2/page-translations").contentType("image/png").content(new byte[]{1,2,3})).andExpect(status().isUnauthorized());
        mvc.perform(get("/v2/page-translations/by-idempotency/{key}", UUID.randomUUID())).andExpect(status().isUnauthorized());
        verifyNoInteractions(processor, attempts);
    }
    @Test void authenticatedReceiptContainsOnlyOwnerMetadataAndNoRecoverableContent() throws Exception {
        var owner = UUID.randomUUID(); var key = UUID.randomUUID(); var operation = UUID.randomUUID();
        var token = "t".repeat(43); var now = Instant.parse("2026-11-01T12:00:00Z");
        when(authenticate.execute(token)).thenReturn(Optional.of(owner));
        when(attempts.find(owner,key)).thenReturn(Optional.of(new VolatileAttemptRepository.Receipt(operation,
            VolatileAttemptRepository.Status.FINISHED,now,now,null)));
        mvc.perform(get("/v2/page-translations/by-idempotency/{key}",key).header("Authorization","Bearer "+token))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.receipt.operationRef").value(operation.toString()))
            .andExpect(jsonPath("$.contentRecoverable").value(false))
            .andExpect(jsonPath("$.result").doesNotExist()).andExpect(jsonPath("$.accessToken").doesNotExist());
        verify(attempts).find(owner,key);
    }
    @Test void anotherInstallationsKeyCannotRevealAReceiptOrTriggerProcessing() throws Exception {
        var owner=UUID.randomUUID(); var key=UUID.randomUUID(); var token="t".repeat(43);
        when(authenticate.execute(token)).thenReturn(Optional.of(owner));
        when(attempts.find(owner,key)).thenReturn(Optional.empty());
        mvc.perform(get("/v2/page-translations/by-idempotency/{key}",key).header("Authorization","Bearer "+token))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.result").doesNotExist());
        verify(attempts).find(owner,key);
        verify(processor).requireEnabled(); verifyNoMoreInteractions(processor);
    }
    @Test void expiredSessionCannotQueryOrExecute() throws Exception {
        when(authenticate.execute("expired")).thenReturn(Optional.empty());
        mvc.perform(get("/v2/page-translations/by-idempotency/{key}",UUID.randomUUID()).header("Authorization","Bearer expired"))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(processor,attempts);
    }
    @Test void revokedInstallationCannotQueryOrExecute() throws Exception {
        when(authenticate.execute("revoked")).thenThrow(new GatewayException(GatewayErrorCode.INSTALLATION_REVOKED,403,false));
        mvc.perform(get("/v2/page-translations/by-idempotency/{key}",UUID.randomUUID()).header("Authorization","Bearer revoked"))
            .andExpect(status().isForbidden());
        verifyNoInteractions(processor,attempts);
    }
    @Test void authenticationDatabaseFailureRemainsSanitized() throws Exception {
        when(authenticate.execute("token")).thenThrow(new IllegalStateException("private-database-content"));
        mvc.perform(get("/v2/page-translations/by-idempotency/{key}",UUID.randomUUID()).header("Authorization","Bearer token"))
            .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("storage-unavailable"));
        verifyNoInteractions(processor,attempts);
    }
    @Test void retiredContentRoutesCannotInvokeAnyProcessingEvenWithBearer() throws Exception {
        mvc.perform(post("/v1/page-jobs").header("Authorization","Bearer unused").contentType("multipart/form-data;boundary=x"))
            .andExpect(status().isGone());
        verifyNoInteractions(processor,attempts,authenticate);
    }
}

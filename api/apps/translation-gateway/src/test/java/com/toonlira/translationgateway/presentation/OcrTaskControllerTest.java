package com.toonlira.translationgateway.presentation;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.inOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.toonlira.translationgateway.application.ProcessOcrTaskUseCase;
import com.toonlira.translationgateway.application.ProcessTranslationTaskUseCase;
import com.toonlira.translationgateway.application.ProcessRenderingTaskUseCase;
import com.toonlira.translationgateway.infrastructure.security.WorkerSecurityConfig;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("worker")
@WebMvcTest(OcrTaskController.class)
@Import({WorkerSecurityConfig.class, GatewayExceptionHandler.class})
class OcrTaskControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean ProcessOcrTaskUseCase process;
    @MockitoBean ProcessTranslationTaskUseCase translation;
    @MockitoBean ProcessRenderingTaskUseCase rendering;

    @Test
    void shouldAcceptOnlyTheOpaqueJobReference() throws Exception {
        var jobRef = UUID.randomUUID();
        mvc.perform(post("/internal/tasks/ocr").contentType("application/json")
                .content("{\"jobRef\":\"" + jobRef + "\"}"))
            .andExpect(status().isNoContent());
        var order = inOrder(process, translation, rendering);
        order.verify(process).execute(jobRef);
        order.verify(translation).execute(jobRef);
        order.verify(rendering).execute(jobRef);
    }

    @Test
    void shouldKeepGatewayRoutesUnavailableInWorkerProfile() throws Exception {
        mvc.perform(get("/v1/capabilities")).andExpect(status().isForbidden());
        mvc.perform(post("/internal/tasks/ocr").contentType("application/json")
                .content("{\"jobRef\":\"" + UUID.randomUUID() + "\",\"media\":\"private\"}"))
            .andExpect(status().isBadRequest());
    }
}

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
    void retiredCloudTaskRouteCannotInvokeAnyStage() throws Exception {
        mvc.perform(post("/internal/tasks/ocr").contentType("application/json")
            .content("{\"jobRef\":\"" + UUID.randomUUID() + "\"}"))
            .andExpect(status().isGone());
        org.mockito.Mockito.verifyNoInteractions(process, translation, rendering);
    }
    @Test void workerCannotExposeTheDirectPublicEndpoint() throws Exception {
        mvc.perform(post("/v2/page-translations").contentType("image/png").content(new byte[]{1})).andExpect(status().isForbidden());
        org.mockito.Mockito.verifyNoInteractions(process, translation, rendering);
    }
}

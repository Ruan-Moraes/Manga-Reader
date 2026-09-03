package com.mangareader.presentation.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.usecase.GetLatestReadingProgressUseCase;
import com.mangareader.application.user.usecase.SaveReadingProgressUseCase;
import com.mangareader.domain.user.entity.ReadingProgress;

@WebMvcTest(ReadingProgressController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ReadingProgressController")
class ReadingProgressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SaveReadingProgressUseCase saveReadingProgressUseCase;

    @MockitoBean
    private GetLatestReadingProgressUseCase getLatestReadingProgressUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private ReadingProgress buildProgress() {
        return ReadingProgress.builder()
                .id("rp-1")
                .userId(USER_ID.toString())
                .titleId("title-1")
                .chapterNumber("5")
                .currentPage(10)
                .totalPages(20)
                .completed(false)
                .updatedAt(LocalDateTime.of(2026, 3, 10, 14, 0))
                .build();
    }

    @Nested
    @DisplayName("PUT /api/users/me/reading-progress")
    class Save {

        @Test
        @DisplayName("Deve retornar 200 ao salvar progresso")
        void deveRetornar200() throws Exception {
            when(saveReadingProgressUseCase.execute(any())).thenReturn(buildProgress());

            mockMvc.perform(put("/api/users/me/reading-progress")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "title-1", "chapterNumber": "5", "currentPage": 10, "totalPages": 20, "completed": false}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.titleId").value("title-1"))
                    .andExpect(jsonPath("$.data.currentPage").value(10));
        }

        @Test
        @DisplayName("Deve retornar 400 quando titleId está em branco")
        void deveRetornar400TitleIdEmBranco() throws Exception {
            mockMvc.perform(put("/api/users/me/reading-progress")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "", "chapterNumber": "5", "currentPage": 10, "totalPages": 20, "completed": false}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando currentPage é menor que 1")
        void deveRetornar400CurrentPageInvalido() throws Exception {
            mockMvc.perform(put("/api/users/me/reading-progress")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "title-1", "chapterNumber": "5", "currentPage": 0, "totalPages": 20, "completed": false}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/users/me/reading-progress/{titleId}")
    class GetLatest {

        @Test
        @DisplayName("Deve retornar 200 com o progresso mais recente")
        void deveRetornar200ComProgresso() throws Exception {
            when(getLatestReadingProgressUseCase.execute(USER_ID, "title-1"))
                    .thenReturn(Optional.of(buildProgress()));

            mockMvc.perform(get("/api/users/me/reading-progress/{titleId}", "title-1")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.chapterNumber").value("5"));
        }

        @Test
        @DisplayName("Deve retornar 200 com data null quando não há progresso")
        void deveRetornar200SemProgresso() throws Exception {
            when(getLatestReadingProgressUseCase.execute(USER_ID, "title-1"))
                    .thenReturn(Optional.empty());

            mockMvc.perform(get("/api/users/me/reading-progress/{titleId}", "title-1")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").doesNotExist());
        }
    }
}

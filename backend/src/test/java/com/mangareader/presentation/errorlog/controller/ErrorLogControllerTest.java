package com.mangareader.presentation.errorlog.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.application.errorlog.usecase.CreateErrorLogUseCase;
import com.mangareader.application.errorlog.usecase.CreateErrorLogUseCase.CreateErrorLogInput;
import com.mangareader.domain.errorlog.entity.ErrorLog;
import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.presentation.errorlog.dto.CreateErrorLogRequest;

@WebMvcTest(ErrorLogController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ErrorLogController")
class ErrorLogControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private CreateErrorLogUseCase createErrorLogUseCase;

    @Test
    @DisplayName("Deve retornar 201 ao criar error log")
    void deveRetornar201AoCriarErrorLog() throws Exception {
        var errorLog = ErrorLog.builder()
                .id("err-1")
                .message("TypeError: x is undefined")
                .source("error-boundary")
                .createdAt(LocalDateTime.of(2026, 3, 28, 12, 0))
                .build();

        when(createErrorLogUseCase.execute(any(CreateErrorLogInput.class)))
                .thenReturn(errorLog);

        var request = new CreateErrorLogRequest(
                "TypeError: x is undefined",
                "TypeError: x is undefined\n    at render",
                "error-boundary",
                "/Manga-Reader/titles/1",
                "Mozilla/5.0",
                "user-123"
        );

        mockMvc.perform(post("/api/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("err-1"))
                .andExpect(jsonPath("$.data.message").value("TypeError: x is undefined"))
                .andExpect(jsonPath("$.data.source").value("error-boundary"));
    }

    @Test
    @DisplayName("Deve retornar 400 quando message esta em branco")
    void deveRetornar400QuandoMessageEmBranco() throws Exception {
        var request = new CreateErrorLogRequest(
                "",
                null,
                "error-boundary",
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Deve retornar 400 quando source esta em branco")
    void deveRetornar400QuandoSourceEmBranco() throws Exception {
        var request = new CreateErrorLogRequest(
                "Some error",
                null,
                "",
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Deve retornar 400 quando message e null")
    void deveRetornar400QuandoMessageNull() throws Exception {
        var json = """
                {
                    "source": "error-boundary"
                }
                """;

        mockMvc.perform(post("/api/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Deve aceitar request com campos opcionais nulos")
    void deveAceitarComCamposOpcionaisNulos() throws Exception {
        var errorLog = ErrorLog.builder()
                .id("err-2")
                .message("Script error")
                .source("window-error")
                .createdAt(LocalDateTime.now())
                .build();

        when(createErrorLogUseCase.execute(any(CreateErrorLogInput.class)))
                .thenReturn(errorLog);

        var request = new CreateErrorLogRequest(
                "Script error",
                null,
                "window-error",
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value("err-2"));
    }
}

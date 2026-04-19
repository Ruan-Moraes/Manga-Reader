package com.mangareader.presentation.stats.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.stats.usecase.GetPublicStatsUseCase;
import com.mangareader.presentation.stats.dto.PublicStatsResponse;

@WebMvcTest(PublicStatsController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PublicStatsController")
class PublicStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private GetPublicStatsUseCase getPublicStatsUseCase;

    @Test
    @DisplayName("GET /api/public/stats deve retornar 200 com totalTitles e totalChapters")
    void deveRetornar200ComEstatisticas() throws Exception {
        when(getPublicStatsUseCase.execute()).thenReturn(new PublicStatsResponse(250L, 4820L));

        mockMvc.perform(get("/api/public/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalTitles").value(250))
                .andExpect(jsonPath("$.data.totalChapters").value(4820));
    }
}

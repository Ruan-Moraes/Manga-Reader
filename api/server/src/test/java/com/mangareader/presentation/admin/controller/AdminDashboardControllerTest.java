package com.mangareader.presentation.admin.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.usecase.admin.GetContentMetricsUseCase;
import com.mangareader.application.user.usecase.admin.GetDashboardMetricsUseCase;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse.TopTitleResponse;
import com.mangareader.presentation.admin.dto.DashboardMetricsResponse;

@WebMvcTest(AdminDashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminDashboardController")
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private GetDashboardMetricsUseCase getDashboardMetricsUseCase;

    @MockitoBean
    private GetContentMetricsUseCase getContentMetricsUseCase;

    @Test
    @DisplayName("Deve retornar 200 com métricas do dashboard")
    void deveRetornar200ComMetricas() throws Exception {
        var metrics = new DashboardMetricsResponse(
                100L, 500L, 20L, 50L, 10L,
                Map.of("ADMIN", 2L, "MODERATOR", 8L, "MEMBER", 90L),
                3L
        );
        when(getDashboardMetricsUseCase.execute()).thenReturn(metrics);

        mockMvc.perform(get("/api/admin/dashboard/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(100))
                .andExpect(jsonPath("$.data.totalTitles").value(500))
                .andExpect(jsonPath("$.data.totalGroups").value(20))
                .andExpect(jsonPath("$.data.totalNews").value(50))
                .andExpect(jsonPath("$.data.totalEvents").value(10))
                .andExpect(jsonPath("$.data.bannedUsers").value(3))
                .andExpect(jsonPath("$.data.usersByRole.ADMIN").value(2));
    }

    @Test
    @DisplayName("Deve retornar 200 com métricas de conteúdo")
    void deveRetornar200ComMetricasDeConteudo() throws Exception {
        var topTitle = new TopTitleResponse(
                "t1", "Top Title", "cover.jpg", "MANGA", 9.5, 4.8, 100L
        );
        var metrics = new ContentMetricsResponse(
                Map.of("ONGOING", 50L, "COMPLETED", 30L),
                Map.of("HAPPENING_NOW", 2L, "COMING_SOON", 5L),
                List.of(topTitle)
        );
        when(getContentMetricsUseCase.execute()).thenReturn(metrics);

        mockMvc.perform(get("/api/admin/dashboard/content-metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.titlesByStatus.ONGOING").value(50))
                .andExpect(jsonPath("$.data.eventsByStatus.HAPPENING_NOW").value(2))
                .andExpect(jsonPath("$.data.topTitles[0].name").value("Top Title"));
    }
}

package com.mangareader.presentation.admin.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.usecase.admin.GetDashboardMetricsUseCase;
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
}

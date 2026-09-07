package com.toonlira.presentation.trending.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.toonlira.application.auth.port.TokenPort;
import com.toonlira.application.trending.port.TrendingReadPort.Ranking;
import com.toonlira.application.trending.port.TrendingReadPort.Window;
import com.toonlira.application.trending.usecase.GetTrendingTitlesUseCase;
import com.toonlira.application.trending.usecase.GetTrendingTitlesUseCase.TrendingTitleView;
import com.toonlira.presentation.trending.dto.TrendingTitleResponse;
import com.toonlira.presentation.trending.dto.TrendingTitleResponse.GrowthResponse;
import com.toonlira.presentation.trending.dto.TrendingTitleResponse.MetricsResponse;
import com.toonlira.presentation.trending.mapper.TrendingMapper;

@WebMvcTest(TrendingController.class)
@AutoConfigureMockMvc(addFilters = false)
class TrendingControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private TokenPort tokenPort;
    @MockitoBean private GetTrendingTitlesUseCase useCase;
    @MockitoBean private TrendingMapper mapper;

    @Test
    void returnsTypedLeaderboardResponse() throws Exception {
        TrendingTitleView view = org.mockito.Mockito.mock(TrendingTitleView.class);
        var response = new TrendingTitleResponse("title-1", "Título", "cover", "MANGA",
                List.of("Ação"), 12.5, 25, new MetricsResponse(10, 2, 1, 3, 1),
                new GrowthResponse(20, 10, 0, 50, 0), Instant.parse("2026-07-11T00:00:00Z"));
        when(useCase.execute(Window.WEEK, Ranking.READS, 5)).thenReturn(List.of(view));
        when(mapper.toResponseList(List.of(view))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/trending")
                        .param("window", "WEEK").param("ranking", "READS").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value("title-1"))
                .andExpect(jsonPath("$.data[0].metrics.reads").value(10))
                .andExpect(jsonPath("$.data[0].growth.reads").value(20));
    }

    @Test
    void rejectsInvalidEnumAndLimit() throws Exception {
        mockMvc.perform(get("/api/trending").param("window", "YEAR"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/trending").param("limit", "0"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/trending").param("limit", "101"))
                .andExpect(status().isBadRequest());
    }
}

package com.mangareader.presentation.trending.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.trending.port.TrendingReadPort.Ranking;
import com.mangareader.application.trending.port.TrendingReadPort.Window;
import com.mangareader.application.trending.usecase.GetTrendingTitlesUseCase;
import com.mangareader.presentation.trending.dto.TrendingTitleResponse;
import com.mangareader.presentation.trending.mapper.TrendingMapper;
import com.mangareader.shared.dto.ApiResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/trending")
@Validated
public class TrendingController {
    private final GetTrendingTitlesUseCase useCase;
    private final TrendingMapper mapper;

    public TrendingController(GetTrendingTitlesUseCase useCase, TrendingMapper mapper) {
        this.useCase = useCase;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TrendingTitleResponse>>> get(
            @RequestParam(defaultValue = "WEEK") Window window,
            @RequestParam(defaultValue = "SCORE") Ranking ranking,
            @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit) {
        var response = mapper.toResponseList(useCase.execute(window, ranking, limit));
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

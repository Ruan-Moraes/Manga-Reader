package com.mangareader.presentation.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.admin.GetContentMetricsUseCase;
import com.mangareader.application.user.usecase.admin.GetDashboardMetricsUseCase;
import com.mangareader.presentation.admin.dto.ContentMetricsResponse;
import com.mangareader.presentation.admin.dto.DashboardMetricsResponse;
import com.mangareader.shared.dto.ApiResponse;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para métricas do dashboard.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final GetDashboardMetricsUseCase getDashboardMetricsUseCase;
    private final GetContentMetricsUseCase getContentMetricsUseCase;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getMetrics() {
        var metrics = getDashboardMetricsUseCase.execute();

        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/content-metrics")
    public ResponseEntity<ApiResponse<ContentMetricsResponse>> getContentMetrics() {
        var metrics = getContentMetricsUseCase.execute();

        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
}

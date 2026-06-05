package com.mangareader.presentation.stats.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.stats.usecase.GetPublicStatsUseCase;
import com.mangareader.presentation.stats.dto.PublicStatsResponse;
import com.mangareader.shared.dto.ApiResponse;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints públicos de estatísticas da plataforma.
 * Não requer autenticação — usados pela landing page.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicStatsController {

    private final GetPublicStatsUseCase getPublicStatsUseCase;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PublicStatsResponse>> getStats() {
        PublicStatsResponse stats = getPublicStatsUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}

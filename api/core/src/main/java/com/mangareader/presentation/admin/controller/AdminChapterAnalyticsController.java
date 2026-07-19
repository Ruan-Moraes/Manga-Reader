package com.mangareader.presentation.admin.controller;

import java.time.Instant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort;
import com.mangareader.application.manga.usecase.admin.GetAdminChapterAnalyticsUseCase;
import com.mangareader.shared.dto.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/chapter-analytics")
@RequiredArgsConstructor
public class AdminChapterAnalyticsController {
    private final GetAdminChapterAnalyticsUseCase useCase;

    @GetMapping("/{chapterId}")
    public ResponseEntity<ApiResponse<GetAdminChapterAnalyticsUseCase.Metrics>> metrics(
            @PathVariable String chapterId, @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to, @RequestParam(required = false) String device,
            @RequestParam(required = false) String platform) {
        return ResponseEntity.ok(ApiResponse.success(useCase.metrics(chapterId,
                new ChapterAnalyticsQueryPort.Filter(from, to, device, platform))));
    }

    @GetMapping("/{chapterId}/series")
    public ResponseEntity<ApiResponse<java.util.List<ChapterAnalyticsQueryPort.SeriesPoint>>> series(
            @PathVariable String chapterId, @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to, @RequestParam(required = false) String device,
            @RequestParam(required = false) String platform,
            @RequestParam(defaultValue = "day") String granularity) {
        return ResponseEntity.ok(ApiResponse.success(useCase.series(chapterId,
                new ChapterAnalyticsQueryPort.Filter(from, to, device, platform), granularity)));
    }
}

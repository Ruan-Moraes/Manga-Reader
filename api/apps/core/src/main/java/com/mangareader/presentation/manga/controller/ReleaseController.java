package com.mangareader.presentation.manga.controller;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.GetReleaseFeedUseCase;
import com.mangareader.application.user.usecase.MarkReleaseSeenUseCase;
import com.mangareader.domain.manga.valueobject.ReleasePeriod;
import com.mangareader.presentation.manga.dto.MarkReleaseDayResponse;
import com.mangareader.presentation.manga.dto.ReleaseFeedResponse;
import com.mangareader.presentation.manga.dto.ReleaseFeedResponse.ScanGroup;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/releases")
@RequiredArgsConstructor
@Tag(name = "Releases", description = "Feed público de capítulos publicados recentemente")
public class ReleaseController {
    private final GetReleaseFeedUseCase getReleaseFeed;
    private final MarkReleaseSeenUseCase markReleaseSeen;

    @GetMapping
    @Operation(summary = "Listar lançamentos recentes")
    public ResponseEntity<ApiResponse<ReleaseFeedResponse>> list(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "WEEK") ReleasePeriod period,
            @RequestParam(defaultValue = "false") boolean libraryOnly,
            @RequestParam(defaultValue = "UTC") String timeZone,
            @CurrentUserId UUID userId,
            @PageParams(defaultSize = 30, defaultSort = "publishedAt",
                    defaultDirection = "desc", ignoreRequestSort = true)
            Pageable pageable) {
        var result = getReleaseFeed.execute(new GetReleaseFeedUseCase.Request(
                q, language, period, libraryOnly, timeZone, userId, pageable));
        var mapped = result.releases().map(item -> new ReleaseFeedResponse.Item(
                item.chapterId(), item.titleId(), item.titleName(), item.titleCover(),
                item.chapterNumber(), item.chapterTitle(), item.publishedAt(),
                item.contentLanguage(),
                item.scanGroupId() == null ? null : new ScanGroup(
                        item.scanGroupId(), item.scanGroupName(), item.scanGroupLogo()),
                item.seen()));
        return ResponseEntity.ok(ApiResponse.success(
                new ReleaseFeedResponse(PageResponse.from(mapped), result.availableLanguages())));
    }

    @PutMapping("/{chapterId}/seen")
    @Operation(summary = "Marcar lançamento como visto")
    public ResponseEntity<ApiResponse<Void>> markChapter(
            @PathVariable String chapterId,
            @CurrentUserId UUID userId) {
        markReleaseSeen.markChapter(userId, chapterId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/days/{date}/seen")
    @Operation(summary = "Marcar todos os lançamentos de um dia como vistos")
    public ResponseEntity<ApiResponse<MarkReleaseDayResponse>> markDay(
            @PathVariable LocalDate date,
            @RequestParam(defaultValue = "UTC") String timeZone,
            @CurrentUserId UUID userId) {
        long count = markReleaseSeen.markDay(userId, date, timeZone);
        return ResponseEntity.ok(ApiResponse.success(new MarkReleaseDayResponse(count)));
    }
}

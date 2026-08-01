package com.mangareader.presentation.manga.dto;

import java.time.Instant;
import java.util.List;

import com.mangareader.shared.dto.PageResponse;

public record ReleaseFeedResponse(
        PageResponse<Item> releases,
        List<String> availableLanguages) {

    public record Item(
            String chapterId,
            String titleId,
            String titleName,
            String titleCover,
            String chapterNumber,
            String chapterTitle,
            Instant publishedAt,
            String contentLanguage,
            ScanGroup scanGroup,
            boolean seen) {}

    public record ScanGroup(String id, String name, String logo) {}
}

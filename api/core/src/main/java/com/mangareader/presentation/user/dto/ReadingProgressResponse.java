package com.mangareader.presentation.user.dto;

import com.mangareader.domain.user.entity.ReadingProgress;

public record ReadingProgressResponse(
        String titleId,
        String chapterNumber,
        int currentPage,
        int totalPages,
        boolean completed,
        String updatedAt
) {
    public static ReadingProgressResponse from(ReadingProgress progress) {
        return new ReadingProgressResponse(
                progress.getTitleId(),
                progress.getChapterNumber(),
                progress.getCurrentPage(),
                progress.getTotalPages(),
                progress.isCompleted(),
                progress.getUpdatedAt() != null ? progress.getUpdatedAt().toString() : null
        );
    }
}

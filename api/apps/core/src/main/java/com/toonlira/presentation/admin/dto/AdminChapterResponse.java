package com.toonlira.presentation.admin.dto;

import java.time.Instant;
import java.util.List;

public record AdminChapterResponse(
        String id, String titleId, String titleName, String title, String number, int displayOrder,
        String description, String status, String contentLanguage, String scanGroupId,
        String scanGroupName, String scanGroupLogo, int pagesCount, int readyPagesCount,
        Instant publishedAt, Instant scheduledAt, long reads, double completionRate,
        Instant createdAt, Instant updatedAt, String createdBy, String updatedBy, Instant deletedAt,
        Long version, List<PageResponse> pages) {
    public record PageResponse(String id, int order, String originalFilename, String imageUrl,
            String thumbnailUrl, int width, int height, long fileSize, String format,
            String processingStatus, Instant createdAt, Instant updatedAt) {}
}

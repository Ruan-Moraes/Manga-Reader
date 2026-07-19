package com.mangareader.presentation.admin.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotEmpty;

public final class AdminChapterRequest {
    private AdminChapterRequest() {}

    public record Create(@NotBlank String titleId, @NotBlank String title, @NotBlank String number,
            Integer displayOrder, String description, String status, Instant scheduledAt) {}
    public record Update(String title, String number, Integer displayOrder, String description,
            Instant scheduledAt, Long version) {}
    public record ChangeStatus(@NotBlank String status, Instant scheduledAt) {}
    public record Reorder(@NotBlank String titleId,
            @NotEmpty @Size(max = 1000) List<@NotBlank String> orderedIds) {}
    public record LegacyPage(String id, int order, String originalFilename, String imageUrl,
            String thumbnailUrl, int width, int height, long fileSize, String format,
            String processingStatus, Instant createdAt, Instant updatedAt) {}
    public record LegacyChapter(@NotBlank String legacyId, @NotBlank String titleId,
            @NotBlank String title, @NotBlank String number, Integer displayOrder,
            String description, String status, Instant scheduledAt, Instant publishedAt,
            Instant createdAt, Instant updatedAt, @Valid @Size(max = 500) List<LegacyPage> pages) {}
    public record LegacyImport(@Valid @Size(min = 1, max = 1000) List<LegacyChapter> chapters) {}
}

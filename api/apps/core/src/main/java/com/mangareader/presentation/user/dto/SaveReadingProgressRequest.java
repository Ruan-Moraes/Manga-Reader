package com.mangareader.presentation.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request de upsert de progresso de leitura (página atual / conclusão de um
 * capítulo).
 */
public record SaveReadingProgressRequest(
        @NotBlank(message = "{validation.readingProgress.titleId.required}")
        String titleId,

        @NotBlank(message = "{validation.readingProgress.chapterNumber.required}")
        String chapterNumber,

        @Min(value = 1, message = "{validation.readingProgress.currentPage.min}")
        int currentPage,

        @Min(value = 1, message = "{validation.readingProgress.totalPages.min}")
        int totalPages,

        boolean completed
) {}

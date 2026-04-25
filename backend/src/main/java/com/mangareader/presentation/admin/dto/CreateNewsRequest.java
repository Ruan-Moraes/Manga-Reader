package com.mangareader.presentation.admin.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de notícia (admin).
 */
public record CreateNewsRequest(
        @NotBlank(message = "{validation.news.title.required}") String title,
        String subtitle,
        String excerpt,
        List<String> content,
        String coverImage,
        @NotNull(message = "{validation.news.category.required}") String category,
        List<String> tags,
        String authorName,
        String authorAvatar,
        String source,
        int readTime,
        boolean isExclusive,
        boolean isFeatured
) {
}

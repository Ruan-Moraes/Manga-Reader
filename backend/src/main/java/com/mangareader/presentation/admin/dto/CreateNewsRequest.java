package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de notícia (admin). Campos textuais multilíngues.
 */
public record CreateNewsRequest(
        @NotNull @RequiredLanguages Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> excerpt,
        Map<String, List<String>> content,
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

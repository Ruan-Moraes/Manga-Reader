package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request para criação de notícia (admin). Campos textuais multilíngues.
 */
public record CreateNewsRequest(
        @NotNull(message = "{validation.news.title.required}") @RequiredLanguages Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> excerpt,
        Map<String, List<String>> content,
        @Pattern(regexp = "^https?://.+", message = "{validation.news.coverImage.url}") String coverImage,
        Map<String, String> coverAlt,
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "{validation.news.slug.invalid}") String slug,
        @NotNull(message = "{validation.news.category.required}") String category,
        @Size(max = 20) List<@Size(max = 60) String> tags,
        String authorName,
        String authorAvatar,
        String source,
        @Min(1) int readTime,
        boolean isExclusive,
        boolean isFeatured,
        Map<String, String> seoTitle,
        Map<String, String> seoDescription,
        Map<String, List<String>> seoKeywords
) {
}

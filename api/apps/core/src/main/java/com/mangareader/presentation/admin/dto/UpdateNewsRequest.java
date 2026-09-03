package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request admin para atualização de notícia. Campos nulos ignorados (PATCH).
 */
public record UpdateNewsRequest(
        Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> excerpt,
        Map<String, List<String>> content,
        @Pattern(regexp = "^(?:https?://.+)?$", message = "{validation.news.coverImage.url}") String coverImage,
        Map<String, String> coverAlt,
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "{validation.news.slug.invalid}") String slug,
        String category,
        @Size(max = 20) List<@Size(max = 60) String> tags,
        String authorName,
        String authorAvatar,
        String source,
        @Min(1) Integer readTime,
        Boolean isExclusive,
        Boolean isFeatured,
        Map<String, String> seoTitle,
        Map<String, String> seoDescription,
        Map<String, List<String>> seoKeywords
) {
}

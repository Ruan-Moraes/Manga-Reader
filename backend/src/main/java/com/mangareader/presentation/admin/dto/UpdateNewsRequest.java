package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

/**
 * Request admin para atualização de notícia. Campos nulos ignorados (PATCH).
 */
public record UpdateNewsRequest(
        String title,
        String subtitle,
        String excerpt,
        List<String> content,
        Map<String, String> titleI18n,
        Map<String, String> subtitleI18n,
        Map<String, String> excerptI18n,
        Map<String, List<String>> contentI18n,
        String coverImage,
        String category,
        List<String> tags,
        String authorName,
        String authorAvatar,
        String source,
        Integer readTime,
        Boolean isExclusive,
        Boolean isFeatured
) {
}

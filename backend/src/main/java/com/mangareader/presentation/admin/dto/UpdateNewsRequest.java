package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

/**
 * Request admin para atualização de notícia. Campos nulos ignorados (PATCH).
 */
public record UpdateNewsRequest(
        Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> excerpt,
        Map<String, List<String>> content,
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

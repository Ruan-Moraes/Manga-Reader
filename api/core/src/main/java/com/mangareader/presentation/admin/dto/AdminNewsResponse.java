package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Resposta admin de notícia. Mapas multilíngues para campos textuais.
 */
public record AdminNewsResponse(
        String id,
        Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> excerpt,
        Map<String, List<String>> content,
        String coverImage,
        String category,
        List<String> tags,
        String authorName,
        String source,
        int readTime,
        int views,
        boolean isExclusive,
        boolean isFeatured,
        LocalDateTime publishedAt,
        LocalDateTime updatedAt
) {
}

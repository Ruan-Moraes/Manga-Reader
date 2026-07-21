package com.mangareader.presentation.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Resposta admin de notícia. Mapas multilíngues para campos textuais.
 */
public record AdminNewsResponse(
        String id,
        String slug,
        Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> excerpt,
        Map<String, List<String>> content,
        String coverImage,
        Map<String, String> coverAlt,
        String category,
        List<String> tags,
        String authorName,
        String source,
        int readTime,
        int views,
        boolean isExclusive,
        boolean isFeatured,
        String status,
        Instant createdAt,
        Instant publishedAt,
        Instant scheduledAt,
        Instant updatedAt,
        Map<String, String> seoTitle,
        Map<String, String> seoDescription,
        Map<String, List<String>> seoKeywords
) {
}

package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resposta de uma notícia para o painel admin.
 */
public record AdminNewsResponse(
        String id,
        String title,
        String subtitle,
        String excerpt,
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

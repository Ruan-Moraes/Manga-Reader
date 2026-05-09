package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Resposta admin de notícia. Mapas *I18n trazem todas as traduções.
 */
public record AdminNewsResponse(
        String id,
        String title,
        String subtitle,
        String excerpt,
        Map<String, String> titleI18n,
        Map<String, String> subtitleI18n,
        Map<String, String> excerptI18n,
        Map<String, List<String>> contentI18n,
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

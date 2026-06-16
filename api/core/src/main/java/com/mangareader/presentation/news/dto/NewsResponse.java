package com.mangareader.presentation.news.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de notícia retornado ao frontend.
 * <p>
 * Compatível com {@code NewsItem} em news.types.ts.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NewsResponse(
        String id,
        String title,
        String subtitle,
        String excerpt,
        List<String> content,
        String coverImage,
        List<String> gallery,
        String source,
        String sourceLogo,
        String category,
        List<String> tags,
        NewsAuthorResponse author,
        String publishedAt,
        String updatedAt,
        int readTime,
        int views,
        int commentsCount,
        int trendingScore,
        boolean isExclusive,
        boolean isFeatured,
        String videoUrl,
        Map<String, String> technicalSheet,
        NewsReactionResponse reactions
) {}

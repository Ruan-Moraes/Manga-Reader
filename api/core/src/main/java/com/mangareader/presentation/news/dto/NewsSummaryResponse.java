package com.mangareader.presentation.news.dto;

import java.util.List;

public record NewsSummaryResponse(
        String id, String slug, String title, String excerpt,
        String coverImage, String coverAlt, NewsCategoryResponse category,
        List<String> tags, NewsAuthorResponse author, String publishedAt,
        int readTime, int views, int commentsCount, int trendingScore,
        boolean isExclusive, boolean isFeatured
) {}

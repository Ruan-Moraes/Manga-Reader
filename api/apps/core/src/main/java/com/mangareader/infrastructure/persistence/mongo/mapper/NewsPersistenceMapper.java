package com.mangareader.infrastructure.persistence.mongo.mapper;

import java.util.List;
import java.util.Map;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.domain.news.valueobject.NewsSeo;
import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.infrastructure.persistence.mongo.document.NewsDocument;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

public final class NewsPersistenceMapper {
    private NewsPersistenceMapper() {}

    public static NewsItem toDomain(NewsDocument document) {
        if (document == null) return null;
        return NewsItem.builder()
                .id(document.getId()).slug(document.getSlug())
                .title(orEmpty(document.getTitle())).subtitle(orEmpty(document.getSubtitle()))
                .excerpt(orEmpty(document.getExcerpt())).content(orEmpty(document.getContent()))
                .coverImage(document.getCoverImage()).coverAlt(orEmpty(document.getCoverAlt()))
                .gallery(document.getGallery() == null ? List.of() : document.getGallery())
                .source(document.getSource()).sourceLogo(document.getSourceLogo())
                .category(document.getCategory()).tags(document.getTags() == null ? List.of() : document.getTags())
                .author(document.getAuthor()).status(document.getStatus() == null ? NewsStatus.DRAFT : document.getStatus())
                .createdAt(document.getCreatedAt()).updatedAt(document.getUpdatedAt())
                .publishedAt(document.getPublishedAt()).scheduledAt(document.getScheduledAt())
                .seo(document.getSeo() == null ? NewsSeo.empty() : document.getSeo())
                .readTime(document.getReadTime()).views(document.getViews()).commentsCount(document.getCommentsCount())
                .trendingScore(document.getTrendingScore()).isExclusive(document.isExclusive()).isFeatured(document.isFeatured())
                .videoUrl(document.getVideoUrl())
                .technicalSheet(document.getTechnicalSheet() == null ? Map.of() : document.getTechnicalSheet())
                .reactions(document.getReactions() == null ? new NewsReaction() : document.getReactions())
                .build();
    }

    public static NewsDocument toDocument(NewsItem item) {
        if (item == null) return null;
        return NewsDocument.builder()
                .id(item.getId()).slug(item.getSlug())
                .title(item.getTitle()).subtitle(item.getSubtitle()).excerpt(item.getExcerpt()).content(item.getContent())
                .coverImage(item.getCoverImage()).coverAlt(item.getCoverAlt()).gallery(item.getGallery())
                .source(item.getSource()).sourceLogo(item.getSourceLogo()).category(item.getCategory())
                .tags(item.getTags()).author(item.getAuthor()).status(item.getStatus())
                .createdAt(item.getCreatedAt()).updatedAt(item.getUpdatedAt()).publishedAt(item.getPublishedAt())
                .scheduledAt(item.getScheduledAt()).seo(item.getSeo()).readTime(item.getReadTime())
                .views(item.getViews()).commentsCount(item.getCommentsCount()).trendingScore(item.getTrendingScore())
                .isExclusive(item.isExclusive()).isFeatured(item.isFeatured()).videoUrl(item.getVideoUrl())
                .technicalSheet(item.getTechnicalSheet()).reactions(item.getReactions())
                .build();
    }

    private static LocalizedString orEmpty(LocalizedString value) {
        return value == null ? LocalizedString.empty() : value;
    }

    private static LocalizedStringList orEmpty(LocalizedStringList value) {
        return value == null ? LocalizedStringList.empty() : value;
    }
}

package com.mangareader.presentation.news.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.application.label.service.DomainLabelService;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.presentation.news.dto.NewsAuthorResponse;
import com.mangareader.presentation.news.dto.NewsReactionResponse;
import com.mangareader.presentation.news.dto.NewsResponse;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;

import lombok.RequiredArgsConstructor;

/**
 * Mapper NewsItem → NewsResponse (público). Resolve title/subtitle/excerpt/content
 * pelo locale do request. Categorias resolvidas via {@link DomainLabelService}.
 */
@Component
@RequiredArgsConstructor
public class NewsMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String LABEL_TYPE_NEWS_CATEGORY = "news_category";

    private final LocalizedMappingHelper i18n;
    private final DomainLabelService domainLabels;

    public NewsResponse toResponse(NewsItem item) {
        if (item == null) return null;

        return new NewsResponse(
                item.getId(),
                i18n.resolveOrFallback(item.getTitleI18n(), item.getTitle()),
                i18n.resolveOrFallback(item.getSubtitleI18n(), item.getSubtitle()),
                i18n.resolveOrFallback(item.getExcerptI18n(), item.getExcerpt()),
                i18n.resolveOrFallback(item.getContentI18n(), item.getContent()),
                item.getCoverImage(),
                item.getGallery(),
                item.getSource(),
                item.getSourceLogo(),
                item.getCategory() != null
                        ? domainLabels.resolveLabel(LABEL_TYPE_NEWS_CATEGORY, item.getCategory().name(), item.getCategory().getDisplayName())
                        : null,
                item.getTags(),
                mapAuthor(item.getAuthor()),
                formatDateTime(item.getPublishedAt()),
                formatDateTime(item.getUpdatedAt()),
                item.getReadTime(),
                item.getViews(),
                item.getCommentsCount(),
                item.getTrendingScore(),
                item.isExclusive(),
                item.isFeatured(),
                item.getVideoUrl(),
                item.getTechnicalSheet(),
                mapReaction(item.getReactions())
        );
    }

    public List<NewsResponse> toResponseList(List<NewsItem> items) {
        if (items == null) return Collections.emptyList();
        return items.stream().map(this::toResponse).toList();
    }

    private static NewsAuthorResponse mapAuthor(NewsAuthor author) {
        if (author == null) return null;
        return new NewsAuthorResponse(
                author.getId(),
                author.getName(),
                author.getAvatar(),
                author.getRole(),
                author.getProfileLink()
        );
    }

    private static NewsReactionResponse mapReaction(NewsReaction reaction) {
        if (reaction == null) return new NewsReactionResponse(0, 0, 0, 0);
        return new NewsReactionResponse(
                reaction.getLike(),
                reaction.getExcited(),
                reaction.getSad(),
                reaction.getSurprised()
        );
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}

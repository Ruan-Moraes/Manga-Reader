package com.mangareader.presentation.news.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.presentation.news.dto.NewsAuthorResponse;
import com.mangareader.presentation.news.dto.NewsReactionResponse;
import com.mangareader.presentation.news.dto.NewsResponse;

/**
 * Mapper para converter entidades de News em DTOs de resposta.
 */
public final class NewsMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private NewsMapper() {}

    public static NewsResponse toResponse(NewsItem item) {
        if (item == null) return null;

        return new NewsResponse(
                item.getId(),
                item.getTitle(),
                item.getSubtitle(),
                item.getExcerpt(),
                item.getContent(),
                item.getCoverImage(),
                item.getGallery(),
                item.getSource(),
                item.getSourceLogo(),
                item.getCategory() != null ? item.getCategory().getDisplayName() : null,
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

    public static List<NewsResponse> toResponseList(List<NewsItem> items) {
        if (items == null) return Collections.emptyList();
        return items.stream().map(NewsMapper::toResponse).toList();
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

package com.mangareader.presentation.news.mapper;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.application.label.service.DomainLabelService;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.domain.news.valueobject.NewsSeo;
import com.mangareader.presentation.news.dto.NewsAuthorResponse;
import com.mangareader.presentation.news.dto.NewsCategoryResponse;
import com.mangareader.presentation.news.dto.NewsReactionResponse;
import com.mangareader.presentation.news.dto.NewsResponse;
import com.mangareader.presentation.news.dto.NewsSeoResponse;
import com.mangareader.presentation.news.dto.NewsSummaryResponse;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;

import lombok.RequiredArgsConstructor;

/**
 * Mapper NewsItem → NewsResponse (público). Resolve title/subtitle/excerpt/content
 * pelo locale do request. Categorias resolvidas via {@link DomainLabelService}.
 */
@Component
@RequiredArgsConstructor
public class NewsMapper {

    private static final String LABEL_TYPE_NEWS_CATEGORY = "news_category";

    private final LocalizedMappingHelper i18n;
    private final DomainLabelService domainLabels;

    public NewsResponse toResponse(NewsItem item) {
        if (item == null) return null;

        return new NewsResponse(
                item.getId(),
                item.getSlug(),
                i18n.toResolvedString(item.getTitle()),
                i18n.toResolvedString(item.getSubtitle()),
                i18n.toResolvedString(item.getExcerpt()),
                i18n.toResolvedList(item.getContent()),
                item.getCoverImage(),
                i18n.toResolvedString(item.getCoverAlt()),
                item.getGallery(),
                item.getSource(),
                item.getSourceLogo(),
                mapCategory(item),
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
                mapReaction(item.getReactions()),
                mapSeo(item)
        );
    }

    public NewsSummaryResponse toSummary(NewsItem item) {
        return new NewsSummaryResponse(item.getId(), item.getSlug(),
                i18n.toResolvedString(item.getTitle()), i18n.toResolvedString(item.getExcerpt()),
                item.getCoverImage(), i18n.toResolvedString(item.getCoverAlt()), mapCategory(item),
                item.getTags(), mapAuthor(item.getAuthor()), formatDateTime(item.getPublishedAt()),
                item.getReadTime(), item.getViews(), item.getCommentsCount(), item.getTrendingScore(),
                item.isExclusive(), item.isFeatured());
    }

    private NewsCategoryResponse mapCategory(NewsItem item) {
        if (item.getCategory() == null) return null;
        return new NewsCategoryResponse(item.getCategory().name(),
                domainLabels.resolveLabel(LABEL_TYPE_NEWS_CATEGORY, item.getCategory().name(),
                        item.getCategory().getDisplayName()));
    }

    private NewsSeoResponse mapSeo(NewsItem item) {
        var seo = item.getSeo() == null
                ? NewsSeo.empty() : item.getSeo();
        return new NewsSeoResponse(i18n.toResolvedString(seo.title()),
                i18n.toResolvedString(seo.description()), i18n.toResolvedList(seo.keywords()));
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

    private static String formatDateTime(Instant dateTime) {
        return dateTime == null ? null : dateTime.toString();
    }
}

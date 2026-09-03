package com.mangareader.presentation.admin.mapper;

import java.util.List;
import java.util.Map;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsSeo;
import com.mangareader.presentation.admin.dto.AdminNewsResponse;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

/**
 * Mapper estático NewsItem → AdminNewsResponse.
 */
public final class AdminNewsMapper {

    private AdminNewsMapper() {
    }

    public static AdminNewsResponse toResponse(NewsItem news) {
        var seo = news.getSeo() == null
                ? NewsSeo.empty() : news.getSeo();
        return new AdminNewsResponse(
                news.getId(),
                news.getSlug(),
                values(news.getTitle()),
                values(news.getSubtitle()),
                values(news.getExcerpt()),
                listValues(news.getContent()),
                news.getCoverImage(),
                values(news.getCoverAlt()),
                news.getCategory() != null ? news.getCategory().name() : null,
                news.getTags(),
                news.getAuthor() != null ? news.getAuthor().getName() : null,
                news.getSource(),
                news.getReadTime(),
                news.getViews(),
                news.isExclusive(),
                news.isFeatured(),
                news.getStatus() != null ? news.getStatus().name() : null,
                news.getCreatedAt(),
                news.getPublishedAt(),
                news.getScheduledAt(),
                news.getUpdatedAt(),
                values(seo.title()),
                values(seo.description()),
                listValues(seo.keywords())
        );
    }

    private static Map<String, String> values(LocalizedString s) {
        return s == null ? Map.of() : s.values();
    }

    private static Map<String, List<String>> listValues(LocalizedStringList s) {
        return s == null ? Map.of() : s.values();
    }
}

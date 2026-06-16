package com.mangareader.presentation.admin.mapper;

import java.util.List;
import java.util.Map;

import com.mangareader.domain.news.entity.NewsItem;
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
        return new AdminNewsResponse(
                news.getId(),
                values(news.getTitle()),
                values(news.getSubtitle()),
                values(news.getExcerpt()),
                listValues(news.getContent()),
                news.getCoverImage(),
                news.getCategory() != null ? news.getCategory().name() : null,
                news.getTags(),
                news.getAuthor() != null ? news.getAuthor().getName() : null,
                news.getSource(),
                news.getReadTime(),
                news.getViews(),
                news.isExclusive(),
                news.isFeatured(),
                news.getPublishedAt(),
                news.getUpdatedAt()
        );
    }

    private static Map<String, String> values(LocalizedString s) {
        return s == null ? Map.of() : s.values();
    }

    private static Map<String, List<String>> listValues(LocalizedStringList s) {
        return s == null ? Map.of() : s.values();
    }
}

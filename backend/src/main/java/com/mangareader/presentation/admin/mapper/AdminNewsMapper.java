package com.mangareader.presentation.admin.mapper;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.presentation.admin.dto.AdminNewsResponse;

/**
 * Mapper estático NewsItem → AdminNewsResponse.
 */
public final class AdminNewsMapper {

    private AdminNewsMapper() {
    }

    public static AdminNewsResponse toResponse(NewsItem news) {
        return new AdminNewsResponse(
                news.getId(),
                news.getTitle(),
                news.getSubtitle(),
                news.getExcerpt(),
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
}

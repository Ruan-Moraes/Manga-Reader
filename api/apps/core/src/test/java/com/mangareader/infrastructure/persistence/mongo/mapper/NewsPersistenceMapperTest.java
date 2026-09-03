package com.mangareader.infrastructure.persistence.mongo.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.infrastructure.persistence.mongo.document.NewsDocument;

class NewsPersistenceMapperTest {

    @Test
    void mapsIncompleteLegacyDocumentToSafeDomainDefaults() {
        NewsDocument document = NewsDocument.builder()
                .id("legacy-news")
                .title(null)
                .content(null)
                .tags(null)
                .gallery(null)
                .status(null)
                .seo(null)
                .reactions(null)
                .technicalSheet(null)
                .build();

        var news = NewsPersistenceMapper.toDomain(document);

        assertThat(news.getTitle()).isNotNull();
        assertThat(news.getContent()).isNotNull();
        assertThat(news.getTags()).isEmpty();
        assertThat(news.getGallery()).isEmpty();
        assertThat(news.getSeo()).isNotNull();
        assertThat(news.getReactions()).isNotNull();
        assertThat(news.getTechnicalSheet()).isEmpty();
        assertThat(news.getStatus()).isEqualTo(NewsStatus.DRAFT);
    }
}

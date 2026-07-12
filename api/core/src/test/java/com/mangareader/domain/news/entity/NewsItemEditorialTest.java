package com.mangareader.domain.news.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.mangareader.domain.news.valueobject.NewsStatus;

class NewsItemEditorialTest {
    private static final Instant NOW = Instant.parse("2026-07-11T12:00:00Z");

    @Test
    void shouldPublishDraftAndKeepFirstPublicationDateOnRepublish() {
        var news = NewsItem.builder().build();
        news.publish(NOW);
        news.unpublish(NOW.plusSeconds(60));
        news.publish(NOW.plusSeconds(120));

        assertThat(news.getStatus()).isEqualTo(NewsStatus.PUBLISHED);
        assertThat(news.getPublishedAt()).isEqualTo(NOW);
    }

    @Test
    void shouldRejectScheduleInThePast() {
        var news = NewsItem.builder().build();
        assertThatThrownBy(() -> news.schedule(NOW.minusSeconds(1), NOW))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shouldClearScheduleWhenMovedToDraft() {
        var news = NewsItem.builder().build();
        news.schedule(NOW.plusSeconds(3600), NOW);
        news.moveToDraft(NOW.plusSeconds(1));

        assertThat(news.getStatus()).isEqualTo(NewsStatus.DRAFT);
        assertThat(news.getScheduledAt()).isNull();
    }
}

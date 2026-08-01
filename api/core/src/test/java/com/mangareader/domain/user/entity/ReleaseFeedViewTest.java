package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class ReleaseFeedViewTest {
    @Test
    void representsPrivateSeenStateWithoutReadingSemantics() {
        Instant seenAt = Instant.parse("2026-07-25T12:00:00Z");
        var view = ReleaseFeedView.builder()
                .userId("user-1")
                .chapterId("chapter-1")
                .seenAt(seenAt)
                .build();

        assertThat(view.getUserId()).isEqualTo("user-1");
        assertThat(view.getChapterId()).isEqualTo("chapter-1");
        assertThat(view.getSeenAt()).isEqualTo(seenAt);
        assertThat(view.naturalKey()).isEqualTo(
                new ReleaseFeedView.Key("user-1", "chapter-1"));
    }
}

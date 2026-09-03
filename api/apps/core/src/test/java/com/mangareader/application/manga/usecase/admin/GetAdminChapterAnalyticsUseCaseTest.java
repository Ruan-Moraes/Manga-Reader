package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort;
import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;

@ExtendWith(MockitoExtension.class)
class GetAdminChapterAnalyticsUseCaseTest {
    @Mock ChapterRepositoryPort chapters;
    @Mock ChapterAnalyticsQueryPort analytics;
    @InjectMocks GetAdminChapterAnalyticsUseCase useCase;

    @Test
    void returnsPersistedReadMetricsInsteadOfSyntheticValues() {
        var publishedAt = Instant.parse("2026-07-01T00:00:00Z");
        var filter = new ChapterAnalyticsQueryPort.Filter(null, null, null, null);
        when(chapters.findById("chapter-1")).thenReturn(Optional.of(Chapter.builder()
                .id("chapter-1").titleId("title-1").number("12").publishedAt(publishedAt).build()));
        when(analytics.summarize("title-1", "12", publishedAt, filter)).thenReturn(
                new ChapterAnalyticsQueryPort.Snapshot(42, 31, 305, .75, .82, 6, 48,
                        Map.of("mobile", 25L, "desktop", 17L, "tablet", 0L),
                        Map.of("web", 17L, "android", 20L, "ios", 5L),
                        publishedAt.plusSeconds(10), publishedAt.plusSeconds(3600), 20, 40));

        var result = useCase.metrics("chapter-1", filter);

        assertThat(result.totalReads()).isEqualTo(42);
        assertThat(result.uniqueReaders()).isEqualTo(31);
        assertThat(result.completionRate()).isEqualTo(.75);
        assertThat(result.readsByPlatform()).containsEntry("android", 20L);
    }
}

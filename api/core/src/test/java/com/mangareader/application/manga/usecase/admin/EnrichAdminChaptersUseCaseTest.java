package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort;
import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort.ChapterKey;
import com.mangareader.application.manga.port.ChapterAnalyticsQueryPort.Snapshot;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
class EnrichAdminChaptersUseCaseTest {
    @Mock private TitleRepositoryPort titles;
    @Mock private ChapterAnalyticsQueryPort analytics;

    @Test
    void batchesTitlesAndAnalyticsForTheWholePage() {
        Chapter first = Chapter.builder().titleId("title-1").number("1").build();
        Chapter second = Chapter.builder().titleId("title-1").number("2").build();
        Title title = Title.builder().id("title-1").build();
        Snapshot snapshot = new Snapshot(1, 1, 0, 0, 0, 0, 0,
                Map.of(), Map.of(), null, null, 0, 0);
        when(titles.findByIds(List.of("title-1"))).thenReturn(List.of(title));
        when(analytics.summarizeMany(any(), any())).thenReturn(Map.of(
                new ChapterKey("title-1", "1"), snapshot,
                new ChapterKey("title-1", "2"), snapshot));
        var useCase = new EnrichAdminChaptersUseCase(titles, analytics);

        var result = useCase.execute(List.of(first, second));

        assertThat(result).hasSize(2).allSatisfy(details -> {
            assertThat(details.title()).isSameAs(title);
            assertThat(details.metrics()).isSameAs(snapshot);
        });
        verify(titles).findByIds(List.of("title-1"));
        verify(analytics).summarizeMany(any(), any());
    }
}

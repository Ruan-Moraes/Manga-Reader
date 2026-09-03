package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.ChapterPage;
import com.mangareader.domain.manga.valueobject.ChapterStatus;

@ExtendWith(MockitoExtension.class)
class PublishScheduledChaptersUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-07-19T18:00:00Z");

    @Mock
    private ChapterRepositoryPort repository;

    @Test
    void publishesOnlyDueChaptersWithReadyPages() {
        Chapter ready = scheduledChapter(List.of(ChapterPage.builder().processingStatus("ready").build()));
        Chapter processing = scheduledChapter(List.of(ChapterPage.builder().processingStatus("processing").build()));
        when(repository.findScheduledBefore(NOW)).thenReturn(List.of(ready, processing));
        var useCase = new PublishScheduledChaptersUseCase(
                repository, Clock.fixed(NOW, ZoneOffset.UTC));

        int published = useCase.execute();

        assertThat(published).isOne();
        assertThat(ready.getStatus()).isEqualTo(ChapterStatus.PUBLISHED);
        assertThat(ready.getPublishedAt()).isEqualTo(NOW);
        assertThat(ready.getScheduledAt()).isNull();
        assertThat(ready.getUpdatedAt()).isEqualTo(NOW);
        assertThat(processing.getStatus()).isEqualTo(ChapterStatus.SCHEDULED);
        verify(repository).saveAll(List.of(ready));
    }

    private Chapter scheduledChapter(List<ChapterPage> pages) {
        return Chapter.builder()
                .status(ChapterStatus.SCHEDULED)
                .scheduledAt(NOW.minusSeconds(60))
                .pageItems(pages)
                .build();
    }
}

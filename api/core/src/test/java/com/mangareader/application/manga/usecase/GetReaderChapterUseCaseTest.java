package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.ChapterStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class GetReaderChapterUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-07-19T18:00:00Z");

    @Mock private ChapterRepositoryPort chapters;
    @Mock private TitleRepositoryPort titles;
    @Mock private AdultContentAccessPolicy adultPolicy;
    private GetReaderChapterUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GetReaderChapterUseCase(chapters, titles, adultPolicy,
                Clock.fixed(NOW, ZoneOffset.UTC));
        when(titles.findById("title-1")).thenReturn(Optional.of(Title.builder().id("title-1").build()));
    }

    @Test
    void hidesPublishedChapterUntilItsPublicationTime() {
        Chapter future = chapter(NOW.plusSeconds(60));
        when(chapters.findAnyByTitleIdAndNumber("title-1", "1")).thenReturn(Optional.of(future));

        assertThatThrownBy(() -> useCase.execute("title-1", "1", false, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void previewCanReadFuturePublishedChapter() {
        Chapter future = chapter(NOW.plusSeconds(60));
        when(chapters.findAnyByTitleIdAndNumber("title-1", "1")).thenReturn(Optional.of(future));

        assertThat(useCase.execute("title-1", "1", true, null)).isSameAs(future);
    }

    private Chapter chapter(Instant publishedAt) {
        return Chapter.builder().titleId("title-1").number("1")
                .status(ChapterStatus.PUBLISHED).publishedAt(publishedAt).build();
    }
}

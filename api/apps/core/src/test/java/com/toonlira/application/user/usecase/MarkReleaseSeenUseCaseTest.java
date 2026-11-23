package com.toonlira.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.toonlira.application.manga.port.ReleaseFeedQueryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.user.port.ReleaseFeedViewRepositoryPort;
import com.toonlira.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class MarkReleaseSeenUseCaseTest {
    @Mock ReleaseFeedQueryPort releases;
    @Mock ReleaseFeedViewRepositoryPort views;
    @Mock AdultContentAccessPolicy adultPolicy;
    private MarkReleaseSeenUseCase useCase;
    private final UUID userId = UUID.randomUUID();
    private final Clock clock = Clock.fixed(Instant.parse("2026-07-25T16:00:00Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        useCase = new MarkReleaseSeenUseCase(releases, views, adultPolicy, clock);
    }

    @Test
    void marksSinglePublicChapterIdempotentlyThroughRepository() {
        when(releases.isPublicChapter("chapter-1", clock.instant(), false)).thenReturn(true);
        useCase.markChapter(userId, "chapter-1");
        verify(views).markSeen(userId.toString(), "chapter-1", clock.instant());
    }

    @Test
    void rejectsUnavailableChapter() {
        assertThatThrownBy(() -> useCase.markChapter(userId, "missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void marksAllPublicChaptersInLocalCalendarDayAsBulk() {
        when(releases.findPublicChapterIds(
                Instant.parse("2026-07-25T03:00:00Z"),
                Instant.parse("2026-07-26T02:59:59.999999999Z"), false))
                .thenReturn(List.of("one", "two"));
        when(views.markSeen(userId.toString(), List.of("one", "two"), clock.instant())).thenReturn(2L);

        long count = useCase.markDay(userId, LocalDate.of(2026, 7, 25), "America/Sao_Paulo");

        assertThat(count).isEqualTo(2);
    }
}

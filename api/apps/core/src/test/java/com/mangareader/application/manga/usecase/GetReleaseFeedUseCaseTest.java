package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.manga.port.ReleaseFeedQueryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.application.user.port.ReleaseFeedViewRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.manga.valueobject.ReleasePeriod;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.BusinessRuleException;

@ExtendWith(MockitoExtension.class)
class GetReleaseFeedUseCaseTest {
    @Mock ReleaseFeedQueryPort releases;
    @Mock ReleaseFeedViewRepositoryPort views;
    @Mock LibraryRepositoryPort library;
    @Mock AdultContentAccessPolicy adultPolicy;
    @Mock LocaleResolutionService locale;
    private GetReleaseFeedUseCase useCase;
    private final Clock clock = Clock.fixed(Instant.parse("2026-07-25T16:00:00Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        useCase = new GetReleaseFeedUseCase(releases, views, library, adultPolicy, locale, clock);
    }

    @Test
    void combinesFiltersLibraryAndSeenState() {
        UUID userId = UUID.randomUUID();
        var saved = SavedManga.builder().titleId("title-1").build();
        when(library.findByUserId(userId)).thenReturn(List.of(saved));
        when(adultPolicy.mustExcludeAdult(userId)).thenReturn(true);
        var item = new ReleaseFeedQueryPort.Item("chapter-1", "title-1",
                Map.of("pt-BR", "Berserk"), "cover", "370", Map.of("pt-BR", "Crepúsculo"),
                Instant.parse("2026-07-25T14:00:00Z"), "pt-BR", null, Map.of(), null);
        var legacy = new ReleaseFeedQueryPort.Item("chapter-legacy", "title-1",
                Map.of("pt-BR", "Berserk"), "cover", "369", Map.of(),
                Instant.parse("2026-07-24T14:00:00Z"), null, null, Map.of(), null);
        when(releases.find(any(), any())).thenReturn(
                new PageImpl<>(List.of(item, legacy), PageRequest.of(0, 30), 2));
        when(releases.findAvailableLanguages(any(), any(), any(Boolean.class))).thenReturn(List.of("pt-BR"));
        when(views.findSeenChapterIds(userId.toString(), List.of("chapter-1", "chapter-legacy")))
                .thenReturn(Set.of("chapter-1"));
        when(locale.resolve(any(LocalizedString.class))).thenReturn("resolved");

        var result = useCase.execute(new GetReleaseFeedUseCase.Request(
                "ber", "pt-BR", ReleasePeriod.WEEK, true, "America/Sao_Paulo", userId, PageRequest.of(0, 30)));

        var query = ArgumentCaptor.forClass(ReleaseFeedQueryPort.Query.class);
        verify(releases).find(query.capture(), any());
        assertThat(query.getValue().from()).isEqualTo(Instant.parse("2026-07-19T03:00:00Z"));
        assertThat(query.getValue().to()).isEqualTo(clock.instant());
        assertThat(query.getValue().titleQuery()).isEqualTo("ber");
        assertThat(query.getValue().language()).isEqualTo("pt-BR");
        assertThat(query.getValue().restrictTitleIds()).containsExactly("title-1");
        assertThat(query.getValue().excludeAdult()).isTrue();

        assertThat(result.releases().getTotalElements()).isEqualTo(2);
        assertThat(result.releases().getContent().getFirst().seen()).isTrue();
        assertThat(result.releases().getContent().get(1)).satisfies(mapped -> {
            assertThat(mapped.contentLanguage()).isNull();
            assertThat(mapped.scanGroupId()).isNull();
            assertThat(mapped.seen()).isFalse();
        });
        assertThat(result.availableLanguages()).containsExactly("pt-BR");
    }

    @Test
    void rejectsAnonymousLibraryFilterAndInvalidTimeZone() {
        assertThatThrownBy(() -> useCase.execute(new GetReleaseFeedUseCase.Request(
                "", "", ReleasePeriod.WEEK, true, "UTC", null, PageRequest.of(0, 30))))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("statusCode").isEqualTo(401);

        assertThatThrownBy(() -> GetReleaseFeedUseCase.parseZone("not/a-zone"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

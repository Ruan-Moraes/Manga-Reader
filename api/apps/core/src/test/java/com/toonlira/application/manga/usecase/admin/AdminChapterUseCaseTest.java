package com.toonlira.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import com.toonlira.application.manga.port.ChapterRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.user.port.ReleaseFeedViewRepositoryPort;
import com.toonlira.domain.manga.entity.Chapter;
import com.toonlira.domain.manga.entity.ChapterPage;
import com.toonlira.domain.manga.valueobject.ChapterStatus;
import com.toonlira.shared.exception.BusinessRuleException;

@ExtendWith(MockitoExtension.class)
class AdminChapterUseCaseTest {
    @Mock private ChapterRepositoryPort chapters;
    @Mock private TitleRepositoryPort titles;
    @Mock private GroupRepositoryPort groups;
    @Mock private ReleaseFeedViewRepositoryPort releaseViews;
    private AdminChapterUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new AdminChapterUseCase(chapters, titles, groups, releaseViews,
                Clock.fixed(Instant.parse("2026-07-19T18:00:00Z"), ZoneOffset.UTC));
    }

    @Test
    void rejectsTransitionThatIsNotAllowedByChapterStateMachine() {
        Chapter published = Chapter.builder().id("chapter-1").status(ChapterStatus.PUBLISHED).build();
        when(chapters.findById("chapter-1")).thenReturn(Optional.of(published));

        assertThatThrownBy(() -> useCase.changeStatus(
                "chapter-1", ChapterStatus.DRAFT, null, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Invalid chapter status transition");

        verifyNoInteractions(titles);
    }

    @Test
    void requiresBcp47LanguageForNewChaptersAndAcceptsScriptTags() {
        when(titles.findById("title-1")).thenReturn(Optional.of(
                com.toonlira.domain.manga.entity.Title.builder().id("title-1").build()));

        assertThatThrownBy(() -> useCase.create(new AdminChapterUseCase.CreateInput(
                "title-1", Map.of("pt-BR", "Capítulo"), "1", 1, null,
                ChapterStatus.DRAFT, null, null, null), UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Chapter content language must be a valid BCP 47 tag");

        when(chapters.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        Chapter created = useCase.create(new AdminChapterUseCase.CreateInput(
                "title-1", Map.of("pt-BR", "Capítulo"), "1", 1, null,
                ChapterStatus.DRAFT, null, "zh-Hant", null), UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThat(created.getContentLanguage())
                .isEqualTo("zh-Hant");
    }

    @Test
    void requiresLanguageBeforePublishingLegacyChapter() {
        Chapter legacy = Chapter.builder().id("legacy").status(ChapterStatus.DRAFT)
                .pageItems(List.of(ChapterPage.builder().processingStatus("ready").build()))
                .build();
        when(chapters.findById("legacy")).thenReturn(Optional.of(legacy));

        assertThatThrownBy(() -> useCase.changeStatus(
                "legacy", ChapterStatus.PUBLISHED, null, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Chapter content language must be a valid BCP 47 tag");
    }

    @Test
    void explicitlyClearsDenormalizedScanGroupSnapshot() {
        Chapter chapter = Chapter.builder().id("chapter-1")
                .scanGroupId(UUID.randomUUID().toString())
                .scanGroupName(com.toonlira.shared.domain.i18n.LocalizedString.of(
                        Map.of("pt-BR", "Grupo")))
                .scanGroupLogo("https://cdn.example/group.png")
                .build();
        when(chapters.findById("chapter-1")).thenReturn(Optional.of(chapter));
        when(chapters.save(chapter)).thenReturn(chapter);

        Chapter updated = useCase.update("chapter-1", new AdminChapterUseCase.UpdateInput(
                null, null, null, null, null, null, null, null, true), UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThat(updated.getScanGroupId()).isNull();
        org.assertj.core.api.Assertions.assertThat(updated.getScanGroupName()).isNull();
        org.assertj.core.api.Assertions.assertThat(updated.getScanGroupLogo()).isNull();
        verifyNoInteractions(groups);
    }

    @Test
    void legacyImportRejectsInvalidStatusWithoutAbortingTheBatch() {
        var input = new AdminChapterUseCase.LegacyChapterInput(
                "legacy-1", "title-1", "Capítulo", "1", null, null,
                null, null, "NOT_A_STATUS", null, null, null, null, List.of());
        when(titles.findById("title-1")).thenReturn(Optional.of(
                com.toonlira.domain.manga.entity.Title.builder().id("title-1").build()));

        var result = useCase.importLegacy(List.of(input), UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThat(result.accepted()).isEmpty();
        org.assertj.core.api.Assertions.assertThat(result.rejected()).singleElement()
                .satisfies(failure -> org.assertj.core.api.Assertions.assertThat(failure.reason())
                        .isEqualTo("Invalid legacy chapter status"));
    }

    @Test
    void reordersOnlyWhenTheRequestContainsTheCompleteActiveSet() {
        Chapter first = Chapter.builder().id("one").displayOrder(1).build();
        Chapter second = Chapter.builder().id("two").displayOrder(2).build();
        when(chapters.findActiveByTitleId("title-1")).thenReturn(List.of(first, second));

        useCase.reorder("title-1", List.of("two", "one"), UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThat(second.getDisplayOrder()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(first.getDisplayOrder()).isEqualTo(2);
        verify(chapters).saveAll(List.of(second, first));
    }

    @Test
    void rejectsPartialReorderWithoutWritingAnything() {
        when(chapters.findActiveByTitleId("title-1")).thenReturn(List.of(
                Chapter.builder().id("one").build(), Chapter.builder().id("two").build()));

        assertThatThrownBy(() -> useCase.reorder(
                "title-1", List.of("one"), UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);

        org.mockito.Mockito.verify(chapters, org.mockito.Mockito.never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void duplicatesAsDraftWithNextNumberAndIndependentPageIds() {
        Chapter source = Chapter.builder().id("source").titleId("title-1").number("2")
                .status(ChapterStatus.PUBLISHED).pageItems(List.of(
                        ChapterPage.builder().id("page-1").order(1)
                                .imageUrl("https://cdn.example/page.jpg").processingStatus("ready").build()))
                .build();
        when(chapters.findById("source")).thenReturn(Optional.of(source));
        when(chapters.findActiveByTitleId("title-1")).thenReturn(List.of(
                source, Chapter.builder().id("three").number("3").build()));
        when(chapters.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));

        Chapter copy = useCase.duplicate("source", UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThat(copy.getNumber()).isEqualTo("4");
        org.assertj.core.api.Assertions.assertThat(copy.getStatus()).isEqualTo(ChapterStatus.DRAFT);
        org.assertj.core.api.Assertions.assertThat(copy.getPageItems()).singleElement().satisfies(page -> {
            org.assertj.core.api.Assertions.assertThat(page.getId()).isNotEqualTo("page-1");
            org.assertj.core.api.Assertions.assertThat(page.getImageUrl()).isEqualTo("https://cdn.example/page.jpg");
        });
    }

    @Test
    void translatesConcurrentDuplicateNumberIntoConflict() {
        Chapter source = Chapter.builder().id("source").titleId("title-1").number("1").build();
        when(chapters.findById("source")).thenReturn(Optional.of(source));
        when(chapters.findActiveByTitleId("title-1")).thenReturn(List.of(source));
        when(chapters.save(org.mockito.ArgumentMatchers.any()))
                .thenThrow(new DuplicateKeyException("unique index"));

        assertThatThrownBy(() -> useCase.duplicate("source", UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Chapter number already exists for this title");
    }
}

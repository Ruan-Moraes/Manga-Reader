package com.toonlira.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.toonlira.application.author.port.TitleAuthorRepositoryPort;
import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.manga.port.TitleReferenceMatch;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.port.TitleSearchHit;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.publisher.port.TitlePublisherRepositoryPort;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;
import com.toonlira.shared.application.i18n.LocaleResolutionService;

@ExtendWith(MockitoExtension.class)
@DisplayName("SearchTitlesUseCase")
class SearchTitlesUseCaseTest {
    private static final PageRequest PAGEABLE = PageRequest.of(0, 10);

    @Mock private TitleRepositoryPort titleRepository;
    @Mock private TitleAuthorRepositoryPort titleAuthorRepository;
    @Mock private GroupRepositoryPort groupRepository;
    @Mock private TitlePublisherRepositoryPort titlePublisherRepository;
    @Mock private AdultContentAccessPolicy adultContentAccessPolicy;
    @Mock private LocaleResolutionService localeResolutionService;

    @InjectMocks private SearchTitlesUseCase useCase;

    @Test
    @DisplayName("Normaliza espaços e acentos e pesquisa todas as fontes")
    void searchAllSources() {
        var title = Title.builder().id("t1").build();
        var hit = new TitleSearchHit(title, TitleSearchMatchType.AUTHOR, "Autor");
        var authorMatch = new TitleReferenceMatch("t1", TitleSearchMatchType.AUTHOR, "Autor");

        when(localeResolutionService.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(titleAuthorRepository.searchTitleReferences("acao hero")).thenReturn(List.of(authorMatch));
        when(groupRepository.searchTitleReferences("acao hero")).thenReturn(List.of());
        when(titleRepository.searchGlobal(
                org.mockito.ArgumentMatchers.eq("acao hero"),
                org.mockito.ArgumentMatchers.eq(List.of("pt-BR")),
                anyMap(),
                org.mockito.ArgumentMatchers.eq(false),
                org.mockito.ArgumentMatchers.eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(List.of(hit), PAGEABLE, 1));

        var result = useCase.execute("  Áção   Hero ", PAGEABLE);

        assertThat(result.getContent()).containsExactly(hit);
        verify(titleAuthorRepository).searchTitleReferences("acao hero");
        verify(groupRepository).searchTitleReferences("acao hero");
    }

    @Test
    @DisplayName("Mantém autor com precedência quando o mesmo título também casa com grupo")
    void authorPrecedesGroup() {
        var author = new TitleReferenceMatch("t1", TitleSearchMatchType.AUTHOR, "Kentaro Miura");
        var group = new TitleReferenceMatch("t1", TitleSearchMatchType.GROUP, "Falconia");

        when(localeResolutionService.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(titleAuthorRepository.searchTitleReferences("berserk")).thenReturn(List.of(author));
        when(groupRepository.searchTitleReferences("berserk")).thenReturn(List.of(group));
        when(titleRepository.searchGlobal(
                org.mockito.ArgumentMatchers.eq("berserk"),
                org.mockito.ArgumentMatchers.anyList(),
                org.mockito.ArgumentMatchers.argThat(map -> author.equals(map.get("t1"))),
                org.mockito.ArgumentMatchers.eq(false),
                org.mockito.ArgumentMatchers.eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(List.of(), PAGEABLE, 0));

        useCase.execute("berserk", PAGEABLE);

        verify(titleRepository).searchGlobal(
                org.mockito.ArgumentMatchers.eq("berserk"),
                org.mockito.ArgumentMatchers.anyList(),
                org.mockito.ArgumentMatchers.argThat(map -> author.equals(map.get("t1"))),
                org.mockito.ArgumentMatchers.eq(false),
                org.mockito.ArgumentMatchers.eq(PAGEABLE));
    }

    @Test
    @DisplayName("Rejeita termos menores que dois ou maiores que cem caracteres")
    void validatesLength() {
        assertThatThrownBy(() -> useCase.execute("a", PAGEABLE)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> useCase.execute("x".repeat(101), PAGEABLE)).isInstanceOf(IllegalArgumentException.class);
    }
}

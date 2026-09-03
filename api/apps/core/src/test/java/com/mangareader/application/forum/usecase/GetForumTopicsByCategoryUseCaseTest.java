package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetForumTopicsByCategoryUseCase")
class GetForumTopicsByCategoryUseCaseTest {
    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private com.mangareader.shared.application.i18n.LocaleResolutionService localeResolver;

    @InjectMocks
    private GetForumTopicsByCategoryUseCase getForumTopicsByCategoryUseCase;

    @Test
    @DisplayName("Deve retornar tópicos filtrados por categoria")
    void deveRetornarTopicosFiltradosPorCategoria() {
        ForumCategory category = ForumCategory.RECOMENDACOES;

        Pageable pageable = PageRequest.of(0, 10);

        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("Recomendação 1").category(category).authorId("author-1").authorName("Autor").build(),
                ForumTopic.builder().title("Recomendação 2").category(category).authorId("author-1").authorName("Autor").build()
        );

        Page<ForumTopic> page = new PageImpl<>(topics, pageable, 2);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(forumRepository.findByCategoryAndLanguageIn(category, List.of("pt-BR"), pageable)).thenReturn(page);

        Page<ForumTopic> result = getForumTopicsByCategoryUseCase.execute(category, pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allSatisfy(t ->
                assertThat(t.getCategory()).isEqualTo(ForumCategory.RECOMENDACOES));
    }

    @Test
    @DisplayName("Deve retornar página vazia quando categoria não tem tópicos")
    void deveRetornarPaginaVaziaParaCategoriaSemTopicos() {
        ForumCategory category = ForumCategory.FANART;
        Pageable pageable = PageRequest.of(0, 10);
        Page<ForumTopic> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(forumRepository.findByCategoryAndLanguageIn(category, List.of("pt-BR"), pageable)).thenReturn(emptyPage);

        Page<ForumTopic> result = getForumTopicsByCategoryUseCase.execute(category, pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("crossLanguage=true bypassa partição usando findByCategory")
    void crossLanguageBypassaParticao() {
        ForumCategory category = ForumCategory.GERAL;

        Pageable pageable = PageRequest.of(0, 10);

        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("PT").language("pt-BR").category(category).authorId("author-1").authorName("Autor").build(),
                ForumTopic.builder().title("EN").language("en-US").category(category).authorId("author-1").authorName("Autor").build()
        );

        Page<ForumTopic> page = new PageImpl<>(topics, pageable, 2);

        when(forumRepository.findByCategory(category, pageable)).thenReturn(page);

        Page<ForumTopic> result = getForumTopicsByCategoryUseCase.execute(category, pageable, true);

        assertThat(result.getContent()).extracting(ForumTopic::getLanguage)
                .containsExactly("pt-BR", "en-US");

        org.mockito.Mockito.verifyNoInteractions(localeResolver);
    }

    @Test
    @DisplayName("crossLanguage=false mantém partição (default)")
    void crossLanguageFalseMantemParticao() {
        ForumCategory category = ForumCategory.RECOMENDACOES;

        Pageable pageable = PageRequest.of(0, 10);

        Page<ForumTopic> page = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("es-ES"));
        when(forumRepository.findByCategoryAndLanguageIn(category, List.of("es-ES"), pageable)).thenReturn(page);

        getForumTopicsByCategoryUseCase.execute(category, pageable, false);

        org.mockito.Mockito.verify(forumRepository).findByCategoryAndLanguageIn(category, List.of("es-ES"), pageable);
        org.mockito.Mockito.verify(forumRepository, org.mockito.Mockito.never()).findByCategory(category, pageable);
    }
}

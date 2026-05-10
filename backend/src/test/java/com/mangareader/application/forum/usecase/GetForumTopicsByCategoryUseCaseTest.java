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
import com.mangareader.domain.user.entity.User;

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
        // Arrange
        ForumCategory category = ForumCategory.RECOMENDACOES;
        Pageable pageable = PageRequest.of(0, 10);
        User author = User.builder().id(java.util.UUID.randomUUID()).name("Autor").build();
        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("Recomendação 1").category(category).author(author).build(),
                ForumTopic.builder().title("Recomendação 2").category(category).author(author).build()
        );
        Page<ForumTopic> page = new PageImpl<>(topics, pageable, 2);
        when(forumRepository.findByCategoryAndLanguage(category, null, pageable)).thenReturn(page);

        // Act
        Page<ForumTopic> result = getForumTopicsByCategoryUseCase.execute(category, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allSatisfy(t ->
                assertThat(t.getCategory()).isEqualTo(ForumCategory.RECOMENDACOES));
    }

    @Test
    @DisplayName("Deve retornar página vazia quando categoria não tem tópicos")
    void deveRetornarPaginaVaziaParaCategoriaSemTopicos() {
        // Arrange
        ForumCategory category = ForumCategory.FANART;
        Pageable pageable = PageRequest.of(0, 10);
        Page<ForumTopic> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(forumRepository.findByCategoryAndLanguage(category, null, pageable)).thenReturn(emptyPage);

        // Act
        Page<ForumTopic> result = getForumTopicsByCategoryUseCase.execute(category, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("crossLanguage=true bypassa partição usando findByCategory")
    void crossLanguageBypassaParticao() {
        ForumCategory category = ForumCategory.GERAL;
        Pageable pageable = PageRequest.of(0, 10);
        User author = User.builder().id(java.util.UUID.randomUUID()).name("Autor").build();
        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("PT").language("pt-BR").category(category).author(author).build(),
                ForumTopic.builder().title("EN").language("en-US").category(category).author(author).build()
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
        when(localeResolver.currentLanguageTag()).thenReturn("es-ES");
        when(forumRepository.findByCategoryAndLanguage(category, "es-ES", pageable)).thenReturn(page);

        getForumTopicsByCategoryUseCase.execute(category, pageable, false);

        org.mockito.Mockito.verify(forumRepository).findByCategoryAndLanguage(category, "es-ES", pageable);
        org.mockito.Mockito.verify(forumRepository, org.mockito.Mockito.never()).findByCategory(category, pageable);
    }
}

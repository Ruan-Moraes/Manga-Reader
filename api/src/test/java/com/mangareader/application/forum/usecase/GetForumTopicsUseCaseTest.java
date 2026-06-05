package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

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
@DisplayName("GetForumTopicsUseCase")
class GetForumTopicsUseCaseTest {
    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private com.mangareader.shared.application.i18n.LocaleResolutionService localeResolver;

    @InjectMocks
    private GetForumTopicsUseCase getForumTopicsUseCase;

    @Test
    @DisplayName("Deve retornar página com tópicos")
    void deveRetornarPaginaComTopicos() {
        Pageable pageable = PageRequest.of(0, 10);

        User author = User.builder().id(UUID.randomUUID()).name("Autor").build();

        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("Tópico 1").category(ForumCategory.GERAL).author(author).build(),
                ForumTopic.builder().title("Tópico 2").category(ForumCategory.TEORIAS).author(author).build()
        );

        Page<ForumTopic> page = new PageImpl<>(topics, pageable, 2);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(forumRepository.findByLanguageIn(List.of("pt-BR"), pageable)).thenReturn(page);

        Page<ForumTopic> result = getForumTopicsUseCase.execute(pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há tópicos")
    void deveRetornarPaginaVazia() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<ForumTopic> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(forumRepository.findByLanguageIn(List.of("pt-BR"), pageable)).thenReturn(emptyPage);

        Page<ForumTopic> result = getForumTopicsUseCase.execute(pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("crossLanguage=true bypassa partição e usa findAll")
    void crossLanguageBypassaParticao() {
        Pageable pageable = PageRequest.of(0, 10);

        User author = User.builder().id(UUID.randomUUID()).name("Autor").build();

        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("PT").language("pt-BR").author(author).build(),
                ForumTopic.builder().title("EN").language("en-US").author(author).build(),
                ForumTopic.builder().title("ES").language("es-ES").author(author).build()
        );

        Page<ForumTopic> page = new PageImpl<>(topics, pageable, 3);

        when(forumRepository.findAll(pageable)).thenReturn(page);

        Page<ForumTopic> result = getForumTopicsUseCase.execute(pageable, true);

        assertThat(result.getContent()).extracting(ForumTopic::getLanguage)
                .containsExactly("pt-BR", "en-US", "es-ES");

        verifyNoInteractions(localeResolver);
        verify(forumRepository, never())
                .findByLanguageIn(anyCollection(), eq(pageable));
    }

    @Test
    @DisplayName("crossLanguage=false mantém partição")
    void crossLanguageFalseMantemParticao() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<ForumTopic> page = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("en-US", "pt-BR"));
        when(forumRepository.findByLanguageIn(List.of("en-US", "pt-BR"), pageable)).thenReturn(page);

        getForumTopicsUseCase.execute(pageable, false);

        verify(forumRepository).findByLanguageIn(List.of("en-US", "pt-BR"), pageable);
        verify(forumRepository, never()).findAll(pageable);
    }
}

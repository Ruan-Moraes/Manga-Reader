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
@DisplayName("GetForumTopicsUseCase")
class GetForumTopicsUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @InjectMocks
    private GetForumTopicsUseCase getForumTopicsUseCase;

    @Test
    @DisplayName("Deve retornar página com tópicos")
    void deveRetornarPaginaComTopicos() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        User author = User.builder().id(java.util.UUID.randomUUID()).name("Autor").build();
        List<ForumTopic> topics = List.of(
                ForumTopic.builder().title("Tópico 1").category(ForumCategory.GERAL).author(author).build(),
                ForumTopic.builder().title("Tópico 2").category(ForumCategory.TEORIAS).author(author).build()
        );
        Page<ForumTopic> page = new PageImpl<>(topics, pageable, 2);
        when(forumRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<ForumTopic> result = getForumTopicsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há tópicos")
    void deveRetornarPaginaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<ForumTopic> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(forumRepository.findAll(pageable)).thenReturn(emptyPage);

        // Act
        Page<ForumTopic> result = getForumTopicsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}

package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetForumTopicByIdUseCase")
class GetForumTopicByIdUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @InjectMocks
    private GetForumTopicByIdUseCase getForumTopicByIdUseCase;

    @Test
    @DisplayName("Deve retornar tópico quando encontrado")
    void deveRetornarTopicoQuandoEncontrado() {
        // Arrange
        UUID topicId = UUID.randomUUID();
        ForumTopic topic = ForumTopic.builder()
                .title("Tópico de teste")
                .category(ForumCategory.GERAL)
                .build();
        when(forumRepository.findById(topicId)).thenReturn(Optional.of(topic));

        // Act
        ForumTopic result = getForumTopicByIdUseCase.execute(topicId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Tópico de teste");
        assertThat(result.getCategory()).isEqualTo(ForumCategory.GERAL);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
    void deveLancarExcecaoQuandoTopicoNaoExiste() {
        // Arrange
        UUID topicId = UUID.randomUUID();
        when(forumRepository.findById(topicId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> getForumTopicByIdUseCase.execute(topicId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

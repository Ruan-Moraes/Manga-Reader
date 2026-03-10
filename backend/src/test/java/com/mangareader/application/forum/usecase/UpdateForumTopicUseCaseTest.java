package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.application.forum.usecase.UpdateForumTopicUseCase.UpdateTopicInput;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateForumTopicUseCase")
class UpdateForumTopicUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @InjectMocks
    private UpdateForumTopicUseCase updateForumTopicUseCase;

    private final UUID TOPIC_ID = UUID.randomUUID();
    private final UUID AUTHOR_ID = UUID.randomUUID();

    private ForumTopic buildTopic() {
        User author = User.builder().id(AUTHOR_ID).name("Autor").email("a@e.com").passwordHash("h").build();
        return ForumTopic.builder()
                .id(TOPIC_ID)
                .author(author)
                .title("Título Original")
                .content("Conteúdo original")
                .category(ForumCategory.GERAL)
                .tags(new java.util.ArrayList<>(List.of("tag1")))
                .build();
    }

    @Nested
    @DisplayName("Atualização parcial (PATCH semântico)")
    class AtualizacaoParcial {

        @Test
        @DisplayName("Deve atualizar apenas o título quando outros campos são null")
        void deveAtualizarApenasTitulo() {
            // Arrange
            ForumTopic topic = buildTopic();
            var input = new UpdateTopicInput(TOPIC_ID, AUTHOR_ID, "Novo Título", null, null, null);
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ForumTopic result = updateForumTopicUseCase.execute(input);

            // Assert
            assertThat(result.getTitle()).isEqualTo("Novo Título");
            assertThat(result.getContent()).isEqualTo("Conteúdo original");
            assertThat(result.getCategory()).isEqualTo(ForumCategory.GERAL);
        }

        @Test
        @DisplayName("Deve atualizar todos os campos simultaneamente")
        void deveAtualizarTodosCampos() {
            // Arrange
            ForumTopic topic = buildTopic();
            var input = new UpdateTopicInput(TOPIC_ID, AUTHOR_ID,
                    "Título Atualizado", "Novo conteúdo", ForumCategory.TEORIAS, List.of("nova-tag"));
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ForumTopic result = updateForumTopicUseCase.execute(input);

            // Assert
            assertThat(result.getTitle()).isEqualTo("Título Atualizado");
            assertThat(result.getContent()).isEqualTo("Novo conteúdo");
            assertThat(result.getCategory()).isEqualTo(ForumCategory.TEORIAS);
            assertThat(result.getTags()).containsExactly("nova-tag");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
        void deveLancarExcecaoQuandoTopicoNaoExiste() {
            // Arrange
            var input = new UpdateTopicInput(TOPIC_ID, AUTHOR_ID, "Novo", null, null, null);
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> updateForumTopicUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ForumTopic");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é o autor")
        void deveLancarExcecaoQuandoNaoEAutor() {
            // Arrange
            ForumTopic topic = buildTopic();
            UUID outroUsuario = UUID.randomUUID();
            var input = new UpdateTopicInput(TOPIC_ID, outroUsuario, "Novo", null, null, null);
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));

            // Act & Assert
            assertThatThrownBy(() -> updateForumTopicUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 400 quando tópico está trancado")
        void deveLancarExcecaoQuandoTopicoTrancado() {
            // Arrange
            ForumTopic topic = buildTopic();
            topic.setLocked(true);
            var input = new UpdateTopicInput(TOPIC_ID, AUTHOR_ID, "Tentativa", null, null, null);
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));

            // Act & Assert
            assertThatThrownBy(() -> updateForumTopicUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("trancado")
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(400));
        }
    }
}

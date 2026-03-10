package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteForumTopicUseCase")
class DeleteForumTopicUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @InjectMocks
    private DeleteForumTopicUseCase deleteForumTopicUseCase;

    private final UUID TOPIC_ID = UUID.randomUUID();
    private final UUID AUTHOR_ID = UUID.randomUUID();

    private ForumTopic buildTopic() {
        User author = User.builder().id(AUTHOR_ID).name("Autor").email("a@e.com").passwordHash("h").build();
        return ForumTopic.builder()
                .id(TOPIC_ID)
                .author(author)
                .title("Tópico para deletar")
                .content("Conteúdo")
                .category(ForumCategory.GERAL)
                .build();
    }

    @Nested
    @DisplayName("Exclusão com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve excluir tópico quando usuário é o autor")
        void deveExcluirTopicoDoAutor() {
            // Arrange
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(buildTopic()));

            // Act
            deleteForumTopicUseCase.execute(TOPIC_ID, AUTHOR_ID);

            // Assert
            verify(forumRepository).deleteById(TOPIC_ID);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
        void deveLancarExcecaoQuandoTopicoNaoExiste() {
            // Arrange
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> deleteForumTopicUseCase.execute(TOPIC_ID, AUTHOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ForumTopic");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é o autor")
        void deveLancarExcecaoQuandoNaoEAutor() {
            // Arrange
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(buildTopic()));
            UUID outroUsuario = UUID.randomUUID();

            // Act & Assert
            assertThatThrownBy(() -> deleteForumTopicUseCase.execute(TOPIC_ID, outroUsuario))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }
    }
}

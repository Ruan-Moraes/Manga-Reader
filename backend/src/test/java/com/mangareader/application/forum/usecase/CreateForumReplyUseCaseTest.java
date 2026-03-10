package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
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
import com.mangareader.application.forum.usecase.CreateForumReplyUseCase.CreateReplyInput;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateForumReplyUseCase")
class CreateForumReplyUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private UserJpaRepository userRepository;

    @InjectMocks
    private CreateForumReplyUseCase createForumReplyUseCase;

    private final UUID TOPIC_ID = UUID.randomUUID();
    private final UUID USER_ID = UUID.randomUUID();

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
    }

    private ForumTopic buildTopic() {
        User author = User.builder().id(UUID.randomUUID()).name("Autor").email("a@e.com").passwordHash("h").build();
        return ForumTopic.builder()
                .id(TOPIC_ID)
                .author(author)
                .title("Tópico de Teste")
                .content("Conteúdo do tópico")
                .category(ForumCategory.GERAL)
                .replyCount(0)
                .replies(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("Criação de resposta com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve adicionar resposta ao tópico e incrementar replyCount")
        void deveAdicionarRespostaEIncrementarContador() {
            // Arrange
            ForumTopic topic = buildTopic();
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Concordo plenamente!");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ForumTopic result = createForumReplyUseCase.execute(input);

            // Assert
            assertThat(result.getReplies()).hasSize(1);
            assertThat(result.getReplies().get(0).getContent()).isEqualTo("Concordo plenamente!");
            assertThat(result.getReplies().get(0).getAuthor().getId()).isEqualTo(USER_ID);
            assertThat(result.getReplyCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Deve incrementar replyCount corretamente quando já existem respostas")
        void deveIncrementarReplyCountCorrectamente() {
            // Arrange
            ForumTopic topic = buildTopic();
            topic.setReplyCount(5);
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Mais uma resposta");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ForumTopic result = createForumReplyUseCase.execute(input);

            // Assert
            assertThat(result.getReplyCount()).isEqualTo(6);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
        void deveLancarExcecaoQuandoTopicoNaoExiste() {
            // Arrange
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Resposta");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> createForumReplyUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ForumTopic");
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando autor não existe")
        void deveLancarExcecaoQuandoAutorNaoExiste() {
            // Arrange
            ForumTopic topic = buildTopic();
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Resposta");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> createForumReplyUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}

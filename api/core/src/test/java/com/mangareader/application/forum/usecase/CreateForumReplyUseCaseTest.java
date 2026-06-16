package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.usecase.CreateCommentUseCase;
import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.application.forum.usecase.CreateForumReplyUseCase.CreateReplyInput;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateForumReplyUseCase")
class CreateForumReplyUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private CreateCommentUseCase createCommentUseCase;

    @InjectMocks
    private CreateForumReplyUseCase createForumReplyUseCase;

    private static final String TOPIC_ID = "topic-1";
    private final UUID USER_ID = UUID.randomUUID();

    private ForumTopic buildTopic() {
        return ForumTopic.builder()
                .id(TOPIC_ID)
                .authorId(UUID.randomUUID().toString())
                .authorName("Autor")
                .title("Tópico de Teste")
                .content("Conteúdo do tópico")
                .category(ForumCategory.GERAL)
                .build();
    }

    @Nested
    @DisplayName("Criação de resposta com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve criar a resposta como comentário unificado (targetType=FORUM_TOPIC)")
        void deveCriarRespostaComoComment() {
            ForumTopic topic = buildTopic();
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Concordo plenamente!");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            createForumReplyUseCase.execute(input);

            ArgumentCaptor<CreateCommentUseCase.CreateCommentInput> captor =
                    ArgumentCaptor.forClass(CreateCommentUseCase.CreateCommentInput.class);
            verify(createCommentUseCase).execute(captor.capture());
            assertThat(captor.getValue().targetType()).isEqualTo(CommentTarget.FORUM_TOPIC);
            assertThat(captor.getValue().targetId()).isEqualTo(TOPIC_ID);
            assertThat(captor.getValue().textContent()).isEqualTo("Concordo plenamente!");
            assertThat(captor.getValue().userId()).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Deve incrementar replyCount e atualizar lastActivityAt")
        void deveIncrementarReplyCount() {
            ForumTopic topic = buildTopic();
            topic.setReplyCount(5);
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Mais uma resposta");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            ForumTopic result = createForumReplyUseCase.execute(input);

            assertThat(result.getReplyCount()).isEqualTo(6);
            assertThat(result.getLastActivityAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
        void deveLancarExcecaoQuandoTopicoNaoExiste() {
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Resposta");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> createForumReplyUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ForumTopic");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando tópico está trancado")
        void deveLancarExcecaoQuandoTopicoTrancado() {
            ForumTopic topic = buildTopic();
            topic.setLocked(true);
            var input = new CreateReplyInput(TOPIC_ID, USER_ID, "Resposta");
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));

            assertThatThrownBy(() -> createForumReplyUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class);

            verify(createCommentUseCase, never()).execute(any());
        }
    }
}

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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.application.forum.port.ForumTopicVoteRepositoryPort;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteForumTopicUseCase")
class DeleteForumTopicUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private ForumTopicVoteRepositoryPort voteRepository;

    @InjectMocks
    private DeleteForumTopicUseCase deleteForumTopicUseCase;

    private static final String TOPIC_ID = "topic-1";
    private final UUID AUTHOR_ID = UUID.randomUUID();

    private ForumTopic buildTopic() {
        return ForumTopic.builder()
                .id(TOPIC_ID)
                .authorId(AUTHOR_ID.toString())
                .authorName("Autor")
                .title("Tópico para deletar")
                .content("Conteúdo")
                .category(ForumCategory.GERAL)
                .build();
    }

    @Nested
    @DisplayName("Exclusão com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve excluir tópico, respostas (comments) e votos quando usuário é o autor")
        void deveExcluirTopicoEmCascata() {
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(buildTopic()));

            deleteForumTopicUseCase.execute(TOPIC_ID, AUTHOR_ID);

            verify(commentRepository).deleteByTargetTypeAndTargetId(CommentTarget.FORUM_TOPIC, TOPIC_ID);
            verify(voteRepository).deleteByTopicId(TOPIC_ID);
            verify(forumRepository).deleteById(TOPIC_ID);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
        void deveLancarExcecaoQuandoTopicoNaoExiste() {
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> deleteForumTopicUseCase.execute(TOPIC_ID, AUTHOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ForumTopic");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é o autor")
        void deveLancarExcecaoQuandoNaoEAutor() {
            when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(buildTopic()));
            UUID outroUsuario = UUID.randomUUID();

            assertThatThrownBy(() -> deleteForumTopicUseCase.execute(TOPIC_ID, outroUsuario))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));

            verify(forumRepository, never()).deleteById(any());
        }
    }
}

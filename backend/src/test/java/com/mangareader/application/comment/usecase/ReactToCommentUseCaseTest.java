package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentReactionRepositoryPort;
import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.entity.CommentReaction;
import com.mangareader.domain.comment.valueobject.ReactionType;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReactToCommentUseCase")
class ReactToCommentUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private CommentReactionRepositoryPort reactionRepository;

    @InjectMocks
    private ReactToCommentUseCase useCase;

    private static final String COMMENT_ID = "comment-abc123";
    private static final String USER_ID = "user-xyz";

    private Comment buildComment(int likes, int dislikes) {
        return Comment.builder()
                .id(COMMENT_ID)
                .textContent("Comentário")
                .likeCount(likes)
                .dislikeCount(dislikes)
                .build();
    }

    @Nested
    @DisplayName("Nova reação")
    class NovaReacao {

        @Test
        @DisplayName("Deve criar reação LIKE e incrementar likeCount")
        void deveCriarReacaoLike() {
            Comment comment = buildComment(5, 2);
            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(reactionRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.empty());
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));
            when(reactionRepository.save(any(CommentReaction.class))).thenAnswer(i -> i.getArgument(0));

            Comment result = useCase.execute(COMMENT_ID, ReactionType.LIKE, USER_ID);

            assertThat(result.getLikeCount()).isEqualTo(6);
            assertThat(result.getDislikeCount()).isEqualTo(2);

            ArgumentCaptor<CommentReaction> captor = ArgumentCaptor.forClass(CommentReaction.class);
            verify(reactionRepository).save(captor.capture());
            assertThat(captor.getValue().getReactionType()).isEqualTo(ReactionType.LIKE);
        }

        @Test
        @DisplayName("Deve criar reação DISLIKE e incrementar dislikeCount")
        void deveCriarReacaoDislike() {
            Comment comment = buildComment(5, 2);
            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(reactionRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.empty());
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));
            when(reactionRepository.save(any(CommentReaction.class))).thenAnswer(i -> i.getArgument(0));

            Comment result = useCase.execute(COMMENT_ID, ReactionType.DISLIKE, USER_ID);

            assertThat(result.getDislikeCount()).isEqualTo(3);
            assertThat(result.getLikeCount()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Toggle off (mesmo tipo)")
    class ToggleOff {

        @Test
        @DisplayName("Deve remover reação LIKE e decrementar likeCount")
        void deveRemoverReacaoLike() {
            Comment comment = buildComment(5, 2);
            CommentReaction existing = CommentReaction.builder()
                    .id("r1").commentId(COMMENT_ID).userId(USER_ID).reactionType(ReactionType.LIKE).build();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(reactionRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.of(existing));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            Comment result = useCase.execute(COMMENT_ID, ReactionType.LIKE, USER_ID);

            assertThat(result.getLikeCount()).isEqualTo(4);
            assertThat(result.getDislikeCount()).isEqualTo(2);
            verify(reactionRepository).delete(existing);
        }

        @Test
        @DisplayName("Não deve decrementar abaixo de zero")
        void naoDeveDecrementarAbaixoDeZero() {
            Comment comment = buildComment(0, 0);
            CommentReaction existing = CommentReaction.builder()
                    .id("r1").commentId(COMMENT_ID).userId(USER_ID).reactionType(ReactionType.LIKE).build();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(reactionRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.of(existing));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

            Comment result = useCase.execute(COMMENT_ID, ReactionType.LIKE, USER_ID);

            assertThat(result.getLikeCount()).isZero();
        }
    }

    @Nested
    @DisplayName("Switch (tipo oposto)")
    class Switch {

        @Test
        @DisplayName("Deve trocar de LIKE para DISLIKE")
        void deveTrocarDeLikeParaDislike() {
            Comment comment = buildComment(5, 2);
            CommentReaction existing = CommentReaction.builder()
                    .id("r1").commentId(COMMENT_ID).userId(USER_ID).reactionType(ReactionType.LIKE).build();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(reactionRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.of(existing));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));
            when(reactionRepository.save(any(CommentReaction.class))).thenAnswer(i -> i.getArgument(0));

            Comment result = useCase.execute(COMMENT_ID, ReactionType.DISLIKE, USER_ID);

            assertThat(result.getLikeCount()).isEqualTo(4);
            assertThat(result.getDislikeCount()).isEqualTo(3);

            ArgumentCaptor<CommentReaction> captor = ArgumentCaptor.forClass(CommentReaction.class);
            verify(reactionRepository).save(captor.capture());
            assertThat(captor.getValue().getReactionType()).isEqualTo(ReactionType.DISLIKE);
        }

        @Test
        @DisplayName("Deve trocar de DISLIKE para LIKE")
        void deveTrocarDeDislikeParaLike() {
            Comment comment = buildComment(5, 2);
            CommentReaction existing = CommentReaction.builder()
                    .id("r1").commentId(COMMENT_ID).userId(USER_ID).reactionType(ReactionType.DISLIKE).build();

            when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
            when(reactionRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.of(existing));
            when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));
            when(reactionRepository.save(any(CommentReaction.class))).thenAnswer(i -> i.getArgument(0));

            Comment result = useCase.execute(COMMENT_ID, ReactionType.LIKE, USER_ID);

            assertThat(result.getLikeCount()).isEqualTo(6);
            assertThat(result.getDislikeCount()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando comentário não existe")
        void deveLancarExcecaoQuandoComentarioNaoExiste() {
            when(commentRepository.findById("inexistente")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute("inexistente", ReactionType.LIKE, USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Comment");
        }
    }
}

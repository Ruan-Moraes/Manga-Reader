package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.entity.CommentVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RemoveCommentVoteUseCase")
class RemoveCommentVoteUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private CommentVoteRepositoryPort voteRepository;

    @InjectMocks
    private RemoveCommentVoteUseCase useCase;

    private static final String COMMENT_ID = "comment-1";
    private static final String USER_ID = "user-xyz";

    private Comment comment(long up, long down) {
        return Comment.builder().id(COMMENT_ID).userId("author").upvotes(up).downvotes(down).build();
    }

    @Test
    @DisplayName("Deve remover o voto e decrementar o contador correspondente")
    void deveRemoverVoto() {
        Comment c = comment(5, 1);
        var existing = CommentVote.builder().commentId(COMMENT_ID).userId(USER_ID).value(VoteValue.UP).build();
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(c));
        when(voteRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.of(existing));

        VoteResult result = useCase.execute(COMMENT_ID, USER_ID);

        assertThat(result.upvotes()).isEqualTo(4);
        assertThat(result.myVote()).isNull();
        verify(voteRepository).delete(existing);
        verify(commentRepository).save(c);
    }

    @Test
    @DisplayName("Idempotente: sem voto apenas retorna contadores, sem salvar")
    void deveSerIdempotenteSemVoto() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment(5, 1)));
        when(voteRepository.findByCommentIdAndUserId(COMMENT_ID, USER_ID)).thenReturn(Optional.empty());

        VoteResult result = useCase.execute(COMMENT_ID, USER_ID);

        assertThat(result.upvotes()).isEqualTo(5);
        verify(voteRepository, never()).delete(any());
        verify(commentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando o comentário não existe")
    void deveLancarQuandoComentarioNaoExiste() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(COMMENT_ID, USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.entity.CommentVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CastCommentVoteUseCase")
class CastCommentVoteUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private CommentVoteRepositoryPort voteRepository;

    @InjectMocks
    private CastCommentVoteUseCase useCase;

    private static final String COMMENT_ID = "comment-abc123";
    private static final String AUTHOR_ID = "author-1";
    private static final String VOTER_ID = "user-xyz";

    private Comment comment(long up, long down) {
        return Comment.builder().id(COMMENT_ID).userId(AUTHOR_ID).upvotes(up).downvotes(down).build();
    }

    @Test
    @DisplayName("Sem voto anterior: cria voto e incrementa upvotes")
    void deveCriarVotoNovo() {
        Comment c = comment(5, 2);
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(c));
        when(voteRepository.findByCommentIdAndUserId(COMMENT_ID, VOTER_ID)).thenReturn(Optional.empty());

        VoteResult result = useCase.execute(COMMENT_ID, VOTER_ID, VoteValue.UP);

        assertThat(result.upvotes()).isEqualTo(6);
        assertThat(result.myVote()).isEqualTo(VoteValue.UP);

        ArgumentCaptor<CommentVote> captor = ArgumentCaptor.forClass(CommentVote.class);
        verify(voteRepository).save(captor.capture());
        assertThat(captor.getValue().getValue()).isEqualTo(VoteValue.UP);
        verify(commentRepository).save(c);
    }

    @Test
    @DisplayName("Mesmo lado: remove o voto (toggle off) e decrementa")
    void deveRemoverNoToggle() {
        Comment c = comment(6, 0);
        var existing = CommentVote.builder().commentId(COMMENT_ID).userId(VOTER_ID).value(VoteValue.UP).build();
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(c));
        when(voteRepository.findByCommentIdAndUserId(COMMENT_ID, VOTER_ID)).thenReturn(Optional.of(existing));

        VoteResult result = useCase.execute(COMMENT_ID, VOTER_ID, VoteValue.UP);

        assertThat(result.upvotes()).isEqualTo(5);
        assertThat(result.myVote()).isNull();
        verify(voteRepository).delete(existing);
    }

    @Test
    @DisplayName("Lado oposto: troca o voto ajustando os dois contadores")
    void deveTrocarLado() {
        Comment c = comment(6, 2);
        var existing = CommentVote.builder().commentId(COMMENT_ID).userId(VOTER_ID).value(VoteValue.UP).build();
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(c));
        when(voteRepository.findByCommentIdAndUserId(COMMENT_ID, VOTER_ID)).thenReturn(Optional.of(existing));

        VoteResult result = useCase.execute(COMMENT_ID, VOTER_ID, VoteValue.DOWN);

        assertThat(result.upvotes()).isEqualTo(5);
        assertThat(result.downvotes()).isEqualTo(3);
        assertThat(result.myVote()).isEqualTo(VoteValue.DOWN);
        assertThat(existing.getValue()).isEqualTo(VoteValue.DOWN);
        verify(voteRepository).save(existing);
    }

    @Test
    @DisplayName("Deve lançar BusinessRuleException 409 ao votar no próprio comentário")
    void deveProibirVotoProprio() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment(0, 0)));

        assertThatThrownBy(() -> useCase.execute(COMMENT_ID, AUTHOR_ID, VoteValue.UP))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(409));

        verify(voteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando o comentário não existe")
    void deveLancarQuandoComentarioNaoExiste() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(COMMENT_ID, VOTER_ID, VoteValue.UP))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Comment");
    }
}

package com.mangareader.application.comment.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.entity.CommentVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra o voto "Útil"/"Contrário" de um usuário em um comentário.
 * <p>
 * Modelo de voto único (espelha {@code CastReviewVoteUseCase}): voto único por
 * usuário por comentário (toggle); votar de novo no mesmo lado remove, votar no
 * oposto troca. Não é permitido votar no próprio comentário. Contadores
 * {@code upvotes}/{@code downvotes} ficam desnormalizados no {@link Comment}.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CastCommentVoteUseCase {
    private final CommentRepositoryPort commentRepository;
    private final CommentVoteRepositoryPort voteRepository;

    public VoteResult execute(String commentId, String userId, VoteValue value) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (userId.equals(comment.getUserId())) {
            throw new BusinessRuleException("Não é possível votar no próprio comentário", 409);
        }

        CommentVote existing = voteRepository.findByCommentIdAndUserId(commentId, userId).orElse(null);

        VoteValue myVote = existing != null
                ? applyExistingVote(comment, existing, value)
                : applyNewVote(comment, commentId, userId, value);

        commentRepository.save(comment);

        return new VoteResult(comment.getUpvotes(), comment.getDownvotes(), myVote);
    }

    private VoteValue applyNewVote(Comment comment, String commentId, String userId, VoteValue value) {
        increment(comment, value, 1);

        voteRepository.save(CommentVote.builder()
                .commentId(commentId)
                .userId(userId)
                .value(value)
                .build());

        return value;
    }

    private VoteValue applyExistingVote(Comment comment, CommentVote existing, VoteValue value) {
        if (existing.getValue() == value) {
            increment(comment, value, -1);
            voteRepository.delete(existing);
            return null;
        }

        increment(comment, existing.getValue(), -1);
        increment(comment, value, 1);
        existing.setValue(value);
        voteRepository.save(existing);
        return value;
    }

    private void increment(Comment comment, VoteValue value, long delta) {
        if (value == VoteValue.UP) {
            comment.setUpvotes(Math.max(0, comment.getUpvotes() + delta));
        } else {
            comment.setDownvotes(Math.max(0, comment.getDownvotes() + delta));
        }
    }
}

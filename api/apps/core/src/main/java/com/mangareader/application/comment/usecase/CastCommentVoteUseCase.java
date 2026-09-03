package com.mangareader.application.comment.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.entity.CommentVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.application.vote.VoteToggle;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra o voto "Útil"/"Contrário" de um usuário em um comentário.
 * <p>
 * Modelo de voto único: a regra do toggle vive em {@link VoteToggle}; aqui
 * ficam a validação (comentário existe, self-vote proibido) e a persistência.
 * Contadores {@code upvotes}/{@code downvotes} ficam desnormalizados no
 * {@link Comment}.
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

        VoteValue myVote = VoteToggle.apply(
                comment,
                existing != null ? existing.getValue() : null,
                value,
                new VoteToggle.VoteStore() {
                    @Override
                    public void create(VoteValue v) {
                        voteRepository.save(CommentVote.builder()
                                .commentId(commentId)
                                .userId(userId)
                                .value(v)
                                .build());
                    }

                    @Override
                    public void switchTo(VoteValue v) {
                        existing.setValue(v);
                        voteRepository.save(existing);
                    }

                    @Override
                    public void delete() {
                        voteRepository.delete(existing);
                    }
                });

        commentRepository.save(comment);

        return new VoteResult(comment.getUpvotes(), comment.getDownvotes(), myVote);
    }
}

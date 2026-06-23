package com.mangareader.application.comment.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.application.vote.VoteToggle;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove o voto de um usuário em um comentário (idempotente: sem voto, apenas
 * retorna os contadores atuais).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class RemoveCommentVoteUseCase {
    private final CommentRepositoryPort commentRepository;
    private final CommentVoteRepositoryPort voteRepository;

    public VoteResult execute(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        voteRepository.findByCommentIdAndUserId(commentId, userId).ifPresent(vote -> {
            VoteToggle.undo(comment, vote.getValue());

            voteRepository.delete(vote);

            commentRepository.save(comment);
        });

        return new VoteResult(comment.getUpvotes(), comment.getDownvotes(), null);
    }
}

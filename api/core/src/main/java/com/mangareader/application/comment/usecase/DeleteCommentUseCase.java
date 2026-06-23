package com.mangareader.application.comment.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui um comentário (somente o autor pode excluir), levando os votos junto
 * — sem FK no Mongo, a cascata é responsabilidade do use case.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class DeleteCommentUseCase {
    private final CommentRepositoryPort commentRepository;
    private final CommentVoteRepositoryPort voteRepository;

    public void execute(String commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getUserId().equals(userId.toString())) {
            throw new BusinessRuleException("Você só pode excluir seus próprios comentários.", 403);
        }

        voteRepository.deleteByCommentId(commentId);
        commentRepository.deleteById(commentId);
    }
}

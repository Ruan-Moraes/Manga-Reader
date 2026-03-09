package com.mangareader.application.comment.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza o texto de um comentário existente.
 */
@Service
@RequiredArgsConstructor
public class UpdateCommentUseCase {

    private final CommentRepositoryPort commentRepository;

    public record UpdateCommentInput(String commentId, String textContent, UUID userId) {}

    public Comment execute(UpdateCommentInput input) {
        Comment comment = commentRepository.findById(input.commentId())
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", input.commentId()));

        if (!comment.getUserId().equals(input.userId().toString())) {
            throw new BusinessRuleException("Você só pode editar seus próprios comentários.", 403);
        }

        comment.setTextContent(input.textContent());
        comment.setWasEdited(true);

        return commentRepository.save(comment);
    }
}

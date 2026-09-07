package com.toonlira.application.comment.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.comment.port.CommentRepositoryPort;
import com.toonlira.domain.comment.entity.Comment;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza o conteúdo de um comentário existente.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class UpdateCommentUseCase {
    private final CommentRepositoryPort commentRepository;

    public record UpdateCommentInput(String commentId, String textContent, String imageContent, UUID userId) {}

    public Comment execute(UpdateCommentInput input) {
        Comment comment = commentRepository.findById(input.commentId())
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", input.commentId()));

        if (!comment.getUserId().equals(input.userId().toString())) {
            throw new BusinessRuleException("Você só pode editar seus próprios comentários.", 403);
        }

        if (isBlank(input.textContent()) && isBlank(input.imageContent())) {
            throw new BusinessRuleException("Comentário deve conter texto ou imagem", 400);
        }

        comment.setTextContent(input.textContent());
        comment.setImageContent(input.imageContent());
        comment.setEdited(true);
        comment.setUpdatedAt(java.time.LocalDateTime.now());

        return commentRepository.save(comment);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

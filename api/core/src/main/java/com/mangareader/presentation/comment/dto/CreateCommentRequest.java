package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um comentário unificado.
 * <p>
 * {@code targetType} aceita {@code TITLE}, {@code CHAPTER}, {@code NEWS},
 * {@code REVIEW} ou {@code FORUM_TOPIC} (resolvido por
 * {@code CommentTarget.fromValue}).
 */
public record CreateCommentRequest(
        @NotBlank(message = "{validation.comment.targetType.required}")
        String targetType,

        @NotBlank(message = "{validation.comment.targetId.required}")
        @Size(max = 100, message = "{validation.rating.titleId.size}")
        String targetId,

        @Size(max = 5000, message = "{validation.comment.content.size}")
        String textContent,

        @Size(max = 2000, message = "{validation.comment.imageContent.size}")
        String imageContent,

        @Size(max = 100, message = "{validation.rating.titleId.size}")
        String parentCommentId
) {}

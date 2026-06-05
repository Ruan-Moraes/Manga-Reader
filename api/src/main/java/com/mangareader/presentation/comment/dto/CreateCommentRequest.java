package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um comentário.
 */
public record CreateCommentRequest(
        @NotBlank(message = "{validation.comment.titleId.required}")
        @Size(max = 100, message = "{validation.rating.titleId.size}")
        String titleId,

        @NotBlank(message = "{validation.comment.content.required}")
        @Size(max = 5000, message = "{validation.comment.content.size}")
        String textContent,

        @Size(max = 2000, message = "{validation.rating.comment.size}")
        String imageContent,

        @Size(max = 100, message = "{validation.rating.titleId.size}")
        String parentCommentId
) {}

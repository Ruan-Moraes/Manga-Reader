package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para atualizar um comentário.
 */
public record UpdateCommentRequest(
        @NotBlank(message = "{validation.comment.content.required}")
        @Size(max = 5000, message = "{validation.comment.content.size}")
        String textContent
) {}

package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para criar um comentário.
 */
public record CreateCommentRequest(
        @NotBlank(message = "ID do título é obrigatório.")
        String titleId,

        @NotBlank(message = "Conteúdo do comentário é obrigatório.")
        String textContent,

        String imageContent,
        String parentCommentId
) {}

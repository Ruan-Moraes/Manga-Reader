package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para atualizar um comentário.
 */
public record UpdateCommentRequest(
        @NotBlank(message = "Conteúdo do comentário é obrigatório.")
        String textContent
) {}

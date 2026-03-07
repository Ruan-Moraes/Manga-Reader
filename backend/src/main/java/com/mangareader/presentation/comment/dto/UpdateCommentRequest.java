package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para atualizar um comentário.
 */
public record UpdateCommentRequest(
        @NotBlank(message = "Conteúdo do comentário é obrigatório.")
        @Size(max = 5000, message = "Conteúdo deve ter no máximo 5000 caracteres.")
        String textContent
) {}

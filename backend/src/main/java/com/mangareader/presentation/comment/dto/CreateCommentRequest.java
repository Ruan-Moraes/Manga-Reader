package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um comentário.
 */
public record CreateCommentRequest(
        @NotBlank(message = "ID do título é obrigatório.")
        @Size(max = 100, message = "ID do título deve ter no máximo 100 caracteres.")
        String titleId,

        @NotBlank(message = "Conteúdo do comentário é obrigatório.")
        @Size(max = 5000, message = "Conteúdo deve ter no máximo 5000 caracteres.")
        String textContent,

        @Size(max = 2000, message = "URL da imagem deve ter no máximo 2000 caracteres.")
        String imageContent,

        @Size(max = 100, message = "ID do comentário pai deve ter no máximo 100 caracteres.")
        String parentCommentId
) {}

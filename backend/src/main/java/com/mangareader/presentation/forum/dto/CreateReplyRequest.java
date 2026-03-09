package com.mangareader.presentation.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar uma resposta em um tópico.
 */
public record CreateReplyRequest(
        @NotBlank(message = "Conteúdo da resposta é obrigatório.")
        @Size(max = 10000, message = "Conteúdo deve ter no máximo 10000 caracteres.")
        String content
) {}

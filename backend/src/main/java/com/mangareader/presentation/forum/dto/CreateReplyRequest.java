package com.mangareader.presentation.forum.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para criar uma resposta em um tópico.
 */
public record CreateReplyRequest(
        @NotBlank(message = "Conteúdo da resposta é obrigatório.")
        String content
) {}

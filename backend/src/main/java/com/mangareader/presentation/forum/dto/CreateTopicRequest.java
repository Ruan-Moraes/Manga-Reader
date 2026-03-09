package com.mangareader.presentation.forum.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um novo tópico no fórum.
 */
public record CreateTopicRequest(
        @NotBlank(message = "Título é obrigatório.")
        @Size(max = 300, message = "Título deve ter no máximo 300 caracteres.")
        String title,

        @NotBlank(message = "Conteúdo é obrigatório.")
        @Size(max = 10000, message = "Conteúdo deve ter no máximo 10000 caracteres.")
        String content,

        @NotNull(message = "Categoria é obrigatória.")
        @Size(max = 100, message = "Categoria deve ter no máximo 100 caracteres.")
        String category,

        List<String> tags
) {}

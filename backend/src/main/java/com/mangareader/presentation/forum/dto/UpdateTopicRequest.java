package com.mangareader.presentation.forum.dto;

import java.util.List;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de tópico do fórum.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateTopicRequest(
        @Size(max = 300, message = "Título deve ter no máximo 300 caracteres")
        String title,

        @Size(max = 10000, message = "Conteúdo deve ter no máximo 10000 caracteres")
        String content,

        @Size(max = 100, message = "Categoria deve ter no máximo 100 caracteres")
        String category,

        List<String> tags
) {}

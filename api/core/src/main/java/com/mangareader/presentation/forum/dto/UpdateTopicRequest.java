package com.mangareader.presentation.forum.dto;

import java.util.List;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de tópico do fórum.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateTopicRequest(
        @Size(max = 300, message = "{validation.forum.topic.title.size}")
        String title,

        @Size(max = 10000, message = "{validation.forum.topic.content.size}")
        String content,

        @Size(max = 100, message = "{validation.forum.topic.category.size}")
        String category,

        List<String> tags
) {}

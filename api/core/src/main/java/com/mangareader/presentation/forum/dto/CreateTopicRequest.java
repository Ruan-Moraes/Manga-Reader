package com.mangareader.presentation.forum.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um novo tópico no fórum.
 */
public record CreateTopicRequest(
        @NotBlank(message = "{validation.forum.topic.title.required}")
        @Size(max = 300, message = "{validation.forum.topic.title.size}")
        String title,

        @NotBlank(message = "{validation.forum.topic.content.required}")
        @Size(max = 10000, message = "{validation.forum.topic.content.size}")
        String content,

        @NotNull(message = "{validation.forum.topic.category.required}")
        @Size(max = 100, message = "{validation.forum.topic.category.size}")
        String category,

        List<String> tags
) {}

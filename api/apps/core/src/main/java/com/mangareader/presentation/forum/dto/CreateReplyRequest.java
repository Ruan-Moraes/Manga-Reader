package com.mangareader.presentation.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar uma resposta em um tópico.
 */
public record CreateReplyRequest(
        @NotBlank(message = "{validation.forum.reply.content.required}")
        @Size(max = 10000, message = "{validation.forum.topic.content.size}")
        String content
) {}

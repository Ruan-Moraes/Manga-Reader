package com.mangareader.presentation.comment.dto;

import jakarta.validation.constraints.Size;

/**
 * Request para atualizar um comentário.
 */
public record UpdateCommentRequest(
        @Size(max = 5000, message = "{validation.comment.content.size}")
        String textContent,

        @Size(max = 2000, message = "{validation.comment.imageContent.size}")
        String imageContent
) {}

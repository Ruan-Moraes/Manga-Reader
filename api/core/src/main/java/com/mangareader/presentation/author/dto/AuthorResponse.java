package com.mangareader.presentation.author.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resposta REST de autor.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthorResponse(
        Long id,
        String name,
        String slug,
        String bio,
        String nationality,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

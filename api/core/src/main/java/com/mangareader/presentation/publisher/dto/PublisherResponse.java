package com.mangareader.presentation.publisher.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resposta REST de editora.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PublisherResponse(
        Long id,
        String name,
        String slug,
        String country,
        String website,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

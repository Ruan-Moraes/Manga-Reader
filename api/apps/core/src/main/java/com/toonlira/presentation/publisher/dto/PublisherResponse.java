package com.toonlira.presentation.publisher.dto;

import java.time.LocalDateTime;
import java.util.List;

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
        String logoUrl,
        String description,
        List<PublisherAliasResponse> aliases,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

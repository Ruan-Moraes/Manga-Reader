package com.toonlira.presentation.author.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.toonlira.domain.author.valueobject.AuthorRole;

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
        String imageUrl,
        List<AuthorAliasResponse> aliases,
        List<AuthorRole> roles,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

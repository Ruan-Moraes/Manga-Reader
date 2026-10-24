package com.toonlira.presentation.author.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criação de autor (admin).
 */
public record CreateAuthorRequest(
        @NotBlank(message = "{validation.author.name.required}")
        @Size(max = 255, message = "{validation.author.name.size}")
        String name,
        String bio,
        @Size(max = 10, message = "{validation.author.nationality.size}")
        String nationality,
        @Size(max = 512) String imageUrl,
        @Valid @Size(max = 20) List<AuthorAliasRequest> aliases
) {
}

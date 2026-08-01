package com.mangareader.presentation.author.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Request admin para atualização de autor. Campos nulos ignorados.
 */
public record UpdateAuthorRequest(
        @Size(max = 255, message = "{validation.author.name.size}")
        String name,
        String bio,
        @Size(max = 10, message = "{validation.author.nationality.size}")
        String nationality,
        @Size(max = 512) String imageUrl,
        @Valid @Size(max = 20) List<AuthorAliasRequest> aliases
) {
}

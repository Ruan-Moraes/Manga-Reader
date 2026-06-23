package com.mangareader.presentation.author.dto;

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
        String nationality
) {
}

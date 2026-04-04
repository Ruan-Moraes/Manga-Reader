package com.mangareader.presentation.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para criação/atualização de tag.
 */
public record TagRequest(
        @NotBlank @Size(max = 60) String label
) {}

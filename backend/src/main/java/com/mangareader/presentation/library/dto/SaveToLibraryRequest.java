package com.mangareader.presentation.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para salvar um título na biblioteca.
 */
public record SaveToLibraryRequest(
        @NotBlank(message = "ID do título é obrigatório.")
        String titleId,

        @NotNull(message = "Tipo de lista é obrigatório.")
        String list
) {}

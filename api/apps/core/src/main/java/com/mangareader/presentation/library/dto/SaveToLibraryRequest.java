package com.mangareader.presentation.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para salvar um título na biblioteca.
 */
public record SaveToLibraryRequest(
        @NotBlank(message = "{validation.library.titleId.required}")
        String titleId,

        @NotNull(message = "{validation.library.listType.required}")
        String list
) {}

package com.mangareader.presentation.admin.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para criação de título (admin).
 */
public record CreateTitleRequest(
        @NotBlank(message = "{validation.title.name.required}") String name,
        @NotBlank(message = "{validation.title.type.required}") String type,
        String cover,
        String synopsis,
        List<String> genres,
        String status,
        String author,
        String artist,
        String publisher,
        boolean adult
) {
}

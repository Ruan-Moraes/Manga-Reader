package com.mangareader.presentation.group.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para adicionar uma obra ao portfólio do grupo.
 */
public record AddWorkRequest(
        @NotBlank(message = "ID do título é obrigatório")
        String titleId,

        @NotBlank(message = "Título da obra é obrigatório")
        @Size(max = 200, message = "Título deve ter no máximo 200 caracteres")
        String title,

        String cover,

        int chapters,

        String status,

        List<String> genres
) {}

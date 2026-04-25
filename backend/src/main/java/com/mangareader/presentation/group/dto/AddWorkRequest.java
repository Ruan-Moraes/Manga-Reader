package com.mangareader.presentation.group.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para adicionar uma obra ao portfólio do grupo.
 */
public record AddWorkRequest(
        @NotBlank(message = "{validation.group.work.titleId.required}")
        String titleId,

        @NotBlank(message = "{validation.group.work.title.required}")
        @Size(max = 200, message = "{validation.group.work.title.size}")
        String title,

        String cover,

        int chapters,

        String status,

        List<String> genres
) {}

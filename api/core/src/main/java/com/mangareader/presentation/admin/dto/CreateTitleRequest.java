package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de título (admin). Mapas multilíngues; pt-BR obrigatório no name.
 * <p>
 * {@code authors}/{@code publishers} são opcionais e populam as junções relacionais
 * em paralelo aos campos texto {@code author}/{@code artist}/{@code publisher}.
 */
public record CreateTitleRequest(
        @NotNull(message = "{validation.title.name.required}") @RequiredLanguages Map<String, String> name,
        @NotBlank(message = "{validation.title.type.required}") String type,
        String cover,
        Map<String, String> synopsis,
        List<String> genres,
        String status,
        String author,
        String artist,
        String publisher,
        boolean adult,
        @Valid List<AuthorAssignmentRequest> authors,
        List<Long> publishers
) {
}

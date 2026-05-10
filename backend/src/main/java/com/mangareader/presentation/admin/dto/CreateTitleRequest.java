package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de título (admin). Mapas multilíngues; pt-BR obrigatório no name.
 */
public record CreateTitleRequest(
        @NotNull @RequiredLanguages Map<String, String> name,
        @NotBlank(message = "{validation.title.type.required}") String type,
        String cover,
        Map<String, String> synopsis,
        List<String> genres,
        String status,
        String author,
        String artist,
        String publisher,
        boolean adult
) {
}

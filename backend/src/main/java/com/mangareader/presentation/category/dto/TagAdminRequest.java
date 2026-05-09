package com.mangareader.presentation.category.dto;

import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotNull;

/**
 * DTO admin para criação/atualização de Tag com traduções por idioma.
 * <p>
 * O mapa precisa conter pelo menos {@code "pt-BR"} (fallback obrigatório).
 * Outras chaves (en-US, es-ES, ...) são opcionais.
 */
public record TagAdminRequest(
        @NotNull
        @RequiredLanguages
        Map<String, String> label
) {}

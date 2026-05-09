package com.mangareader.presentation.group.dto;

import java.util.Map;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de grupo. Campos nulos ignorados (PATCH).
 * Mapas *I18n trazem traduções por idioma; quando presentes, sobrescrevem.
 */
public record UpdateGroupRequest(
        @Size(min = 2, max = 100, message = "{validation.name.size}")
        String name,

        @Size(max = 2000, message = "{validation.group.description.size}")
        String description,

        Map<String, String> nameI18n,

        Map<String, String> descriptionI18n,

        String logo,

        String banner,

        String website
) {}

package com.mangareader.presentation.group.dto;

import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um novo grupo. Campos {@code name} e {@code description}
 * são mapas BCP 47 → texto; pt-BR obrigatório.
 */
public record CreateGroupRequest(
        @NotNull(message = "{validation.group.name.required}")
        @RequiredLanguages
        Map<String, String> name,

        @NotBlank(message = "{validation.group.username.required}")
        @Size(max = 50, message = "{validation.group.username.size}")
        String username,

        Map<String, String> description,
        String logo,
        String banner,
        String website,
        Integer foundedYear
) {}

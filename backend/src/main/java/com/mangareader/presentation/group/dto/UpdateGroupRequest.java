package com.mangareader.presentation.group.dto;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de grupo.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateGroupRequest(
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
        String description,

        String logo,

        String banner,

        String website
) {}

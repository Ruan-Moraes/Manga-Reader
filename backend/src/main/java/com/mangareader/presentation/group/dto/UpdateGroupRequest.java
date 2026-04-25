package com.mangareader.presentation.group.dto;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de grupo.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateGroupRequest(
        @Size(min = 2, max = 100, message = "{validation.name.size}")
        String name,

        @Size(max = 2000, message = "{validation.group.description.size}")
        String description,

        String logo,

        String banner,

        String website
) {}

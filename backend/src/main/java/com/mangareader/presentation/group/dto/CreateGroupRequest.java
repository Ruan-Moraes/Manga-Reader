package com.mangareader.presentation.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um novo grupo.
 */
public record CreateGroupRequest(
        @NotBlank(message = "{validation.group.name.required}")
        @Size(max = 100, message = "{validation.group.name.size}")
        String name,

        @NotBlank(message = "{validation.group.username.required}")
        @Size(max = 50, message = "{validation.group.username.size}")
        String username,

        String description,
        String logo,
        String banner,
        String website,
        Integer foundedYear
) {}

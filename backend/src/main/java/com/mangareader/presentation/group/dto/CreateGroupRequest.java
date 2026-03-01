package com.mangareader.presentation.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criar um novo grupo.
 */
public record CreateGroupRequest(
        @NotBlank(message = "Nome do grupo é obrigatório.")
        @Size(max = 100, message = "Nome do grupo deve ter no máximo 100 caracteres.")
        String name,

        @NotBlank(message = "Username do grupo é obrigatório.")
        @Size(max = 50, message = "Username deve ter no máximo 50 caracteres.")
        String username,

        String description,
        String logo,
        String banner,
        String website,
        Integer foundedYear
) {}

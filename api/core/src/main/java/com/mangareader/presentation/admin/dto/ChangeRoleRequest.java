package com.mangareader.presentation.admin.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request para alterar o role de um usuário.
 */
public record ChangeRoleRequest(
        @NotNull(message = "{validation.role.required}")
        String role
) {
}

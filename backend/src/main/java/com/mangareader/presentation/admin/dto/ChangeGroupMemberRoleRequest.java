package com.mangareader.presentation.admin.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para alterar role de membro em grupo (admin).
 */
public record ChangeGroupMemberRoleRequest(
        @NotBlank(message = "Role é obrigatório") String role
) {
}

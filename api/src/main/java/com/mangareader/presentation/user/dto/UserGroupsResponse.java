package com.mangareader.presentation.user.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Grupos do usuário para a aba "Grupos" do modal de perfil:
 * {@code linked} = vínculos efetivos do usuário; {@code available} = demais grupos.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserGroupsResponse(
        List<UserGroupItemResponse> linked,
        List<UserGroupItemResponse> available
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserGroupItemResponse(
            String id,
            String name,
            String username,
            String logo,
            String role,
            long memberCount
    ) {}
}

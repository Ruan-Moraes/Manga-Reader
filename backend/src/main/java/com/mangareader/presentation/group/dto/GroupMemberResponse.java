package com.mangareader.presentation.group.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de membro de grupo retornado ao frontend.
 * <p>
 * Versão simplificada compatível com {@code GroupMember} do frontend.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroupMemberResponse(
        String id,
        String name,
        String avatar,
        String bio,
        String role,
        String joinedAt
) {}

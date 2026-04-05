package com.mangareader.presentation.group.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de apoiador de grupo retornado ao frontend.
 * <p>
 * Versão simplificada sem role (apoiadores não possuem papel funcional).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroupSupporterResponse(
        String id,
        String name,
        String avatar,
        String joinedAt
) {}

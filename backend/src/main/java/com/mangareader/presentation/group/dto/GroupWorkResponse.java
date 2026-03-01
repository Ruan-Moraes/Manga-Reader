package com.mangareader.presentation.group.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de trabalho traduzido retornado ao frontend.
 * <p>
 * Compatível com {@code GroupWork} do frontend.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroupWorkResponse(
        String id,
        String title,
        String cover,
        int chapters,
        String status,
        int popularity,
        String updatedAt,
        List<String> genres
) {}

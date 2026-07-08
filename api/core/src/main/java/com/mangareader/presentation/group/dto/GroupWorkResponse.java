package com.mangareader.presentation.group.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de trabalho traduzido retornado ao frontend.
 * <p>
 * Compatível com {@code GroupWork} do frontend.
 * <p>
 * {@code id} é o ID do Title no MongoDB (cross-DB ref), usado pelo frontend
 * para navegar até a página do título — não a PK da associação group_works.
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

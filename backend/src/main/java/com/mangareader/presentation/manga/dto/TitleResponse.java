package com.mangareader.presentation.manga.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de título. Capítulos vivem em coleção própria (DT-17) e são obtidos
 * via {@code GET /api/titles/{id}/chapters} (paginado), não embarcados aqui.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TitleResponse(
        String id,
        String type,
        String cover,
        String name,
        String synopsis,
        List<String> genres,
        String popularity,
        Double ratingAverage,
        Long ratingCount,
        Double rankingScore,
        boolean adult,
        String status,
        String author,
        String artist,
        String publisher,
        String createdAt,
        String updatedAt
) {}

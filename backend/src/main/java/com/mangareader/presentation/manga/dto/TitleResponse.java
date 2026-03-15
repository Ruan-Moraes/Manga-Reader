package com.mangareader.presentation.manga.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de título, incluindo capítulos.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TitleResponse(
        String id,
        String type,
        String cover,
        String name,
        String synopsis,
        List<String> genres,
        List<ChapterResponse> chapters,
        String popularity,
        Double ratingAverage,
        Long ratingCount,
        Double rankingScore,
        String author,
        String artist,
        String publisher,
        String createdAt,
        String updatedAt
) {}

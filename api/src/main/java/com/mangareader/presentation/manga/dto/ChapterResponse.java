package com.mangareader.presentation.manga.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de capítulo retornado nas respostas de título.
 * <p>
 * Compatível com o frontend ({@code Chapter} em chapter.types.ts).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChapterResponse(
        String number,
        String title,
        String releaseDate,
        String pages
) {}

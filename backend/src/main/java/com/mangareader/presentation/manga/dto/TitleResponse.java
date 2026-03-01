package com.mangareader.presentation.manga.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de título, incluindo capítulos.
 * <p>
 * Compatível com o frontend ({@code Title} em title.types.ts):
 * <pre>{ id, type, cover, name, synopsis, genres, chapters, popularity, score, author, artist, publisher, createdAt, updatedAt }</pre>
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
        String score,
        String author,
        String artist,
        String publisher,
        String createdAt,
        String updatedAt
) {}

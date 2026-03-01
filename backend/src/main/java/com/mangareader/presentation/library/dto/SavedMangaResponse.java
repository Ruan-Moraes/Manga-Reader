package com.mangareader.presentation.library.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de mangá salvo retornado ao frontend.
 * <p>
 * Compatível com o frontend ({@code SavedMangaItem} em saved-library.types.ts).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SavedMangaResponse(
        String titleId,
        String name,
        String cover,
        String type,
        String list,
        String savedAt
) {}

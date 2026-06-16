package com.mangareader.presentation.manga.dto;

/**
 * Autor associado a um título, com papel. Projeção da junção {@code title_authors}.
 */
public record TitleAuthorResponse(
        Long authorId,
        String name,
        String slug,
        String role
) {
}

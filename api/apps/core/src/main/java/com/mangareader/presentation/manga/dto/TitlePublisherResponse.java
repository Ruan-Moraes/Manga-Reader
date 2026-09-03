package com.mangareader.presentation.manga.dto;

/**
 * Editora associada a um título. Projeção da junção {@code title_publishers}.
 */
public record TitlePublisherResponse(
        Long publisherId,
        String name,
        String slug
) {
}

package com.mangareader.presentation.category.dto;

/**
 * Resposta de Tag — compatível com o frontend Tag { value, slug, label }.
 * {@code slug} é a chave canônica usada como gênero nos títulos.
 */
public record TagResponse(
        Long value,
        String slug,
        String label
) {
}

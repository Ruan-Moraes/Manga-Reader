package com.mangareader.presentation.category.dto;

/**
 * Resposta de Tag — compatível com o frontend Tag { value, label }.
 */
public record TagResponse(
        Long value,
        String label
) {
}

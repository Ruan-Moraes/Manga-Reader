package com.mangareader.presentation.store.dto;

import java.util.List;

/**
 * Resposta de Store — compatível com o frontend Store em store.types.ts.
 */
public record StoreResponse(
        String id,
        String name,
        String logo,
        String icon,
        String description,
        String website,
        String availability,
        Double rating,
        List<String> features
) {
}

package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Resposta admin de título. Mapas multilíngues para name/synopsis.
 */
public record AdminTitleResponse(
        String id,
        Map<String, String> name,
        String type,
        String cover,
        Map<String, String> synopsis,
        List<String> genres,
        String status,
        String author,
        String artist,
        String publisher,
        boolean adult,
        Double ratingAverage,
        Long ratingCount,
        int chaptersCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

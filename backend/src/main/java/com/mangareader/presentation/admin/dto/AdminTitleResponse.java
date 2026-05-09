package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Resposta admin de título. Mapas *I18n trazem todas as traduções.
 */
public record AdminTitleResponse(
        String id,
        String name,
        String type,
        String cover,
        String synopsis,
        Map<String, String> nameI18n,
        Map<String, String> synopsisI18n,
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

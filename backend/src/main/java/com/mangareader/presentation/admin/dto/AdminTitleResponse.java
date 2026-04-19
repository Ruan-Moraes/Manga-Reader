package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resposta de um título para o painel admin.
 */
public record AdminTitleResponse(
        String id,
        String name,
        String type,
        String cover,
        String synopsis,
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

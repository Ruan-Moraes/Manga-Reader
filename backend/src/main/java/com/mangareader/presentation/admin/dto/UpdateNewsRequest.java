package com.mangareader.presentation.admin.dto;

import java.util.List;

/**
 * Request para atualização de notícia (admin). Todos os campos são opcionais.
 */
public record UpdateNewsRequest(
        String title,
        String subtitle,
        String excerpt,
        List<String> content,
        String coverImage,
        String category,
        List<String> tags,
        String authorName,
        String authorAvatar,
        String source,
        Integer readTime,
        Boolean isExclusive,
        Boolean isFeatured
) {
}

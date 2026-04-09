package com.mangareader.presentation.admin.dto;

import java.util.List;

/**
 * Request para atualização de título (admin). Todos os campos são opcionais.
 */
public record UpdateTitleRequest(
        String name,
        String type,
        String cover,
        String synopsis,
        List<String> genres,
        String status,
        String author,
        String artist,
        String publisher,
        Boolean adult
) {
}

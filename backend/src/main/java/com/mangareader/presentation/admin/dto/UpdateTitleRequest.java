package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

/**
 * Request admin para atualização de título. Campos nulos ignorados (PATCH).
 */
public record UpdateTitleRequest(
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
        Boolean adult
) {
}

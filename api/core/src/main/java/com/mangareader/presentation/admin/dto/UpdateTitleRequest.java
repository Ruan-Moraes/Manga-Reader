package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

/**
 * Request admin para atualização de título. Campos nulos ignorados (PATCH).
 */
public record UpdateTitleRequest(
        Map<String, String> name,
        String type,
        String cover,
        Map<String, String> synopsis,
        List<String> genres,
        String status,
        String author,
        String artist,
        String publisher,
        Boolean adult
) {
}

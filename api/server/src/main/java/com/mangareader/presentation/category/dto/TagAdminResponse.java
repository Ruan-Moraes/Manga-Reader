package com.mangareader.presentation.category.dto;

import java.util.Map;

/**
 * Resposta admin de Tag — expõe todas as traduções (mapa BCP 47 → texto)
 * para edição multilíngue. Endpoints públicos usam {@link TagResponse}
 * (label resolvido pelo locale do request).
 */
public record TagAdminResponse(
        Long value,
        String slug,
        Map<String, String> label
) {}

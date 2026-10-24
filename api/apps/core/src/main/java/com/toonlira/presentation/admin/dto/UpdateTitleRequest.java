package com.toonlira.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

/**
 * Request admin para atualização de título. Campos nulos ignorados (PATCH).
 * <p>
 * {@code authors}/{@code publishers} nulos preservam as junções; não-nulos as
 * substituem (replace), em paralelo aos campos texto.
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
        Boolean adult,
        @Valid @jakarta.validation.constraints.Size(max = 20) List<TitleAliasRequest> aliases,
        @Valid List<AuthorAssignmentRequest> authors,
        List<Long> publishers,
        @Valid List<StoreAssignmentRequest> stores
) {
}

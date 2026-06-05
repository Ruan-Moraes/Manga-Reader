package com.mangareader.presentation.group.dto;

import java.util.Map;

/**
 * Request para atualização de grupo. Campos nulos ignorados (PATCH).
 */
public record UpdateGroupRequest(
        Map<String, String> name,
        Map<String, String> description,
        String logo,
        String banner,
        String website
) {}

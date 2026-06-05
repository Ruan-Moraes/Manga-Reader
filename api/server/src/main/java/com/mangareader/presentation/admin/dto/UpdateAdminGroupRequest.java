package com.mangareader.presentation.admin.dto;

import java.util.Map;

/**
 * Request admin para atualização de grupo. Campos nulos ignorados (PATCH).
 */
public record UpdateAdminGroupRequest(
        Map<String, String> name,
        Map<String, String> description,
        String logo,
        String banner,
        String website
) {}

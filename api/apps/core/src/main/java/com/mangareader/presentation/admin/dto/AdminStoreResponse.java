package com.mangareader.presentation.admin.dto;

import java.util.Map;

public record AdminStoreResponse(
        String id, Map<String, String> name, String website, String logo, String icon,
        String status, int displayOrder
) {}

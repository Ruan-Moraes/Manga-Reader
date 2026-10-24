package com.toonlira.presentation.search.dto;

import java.util.List;

public record RelatedTitleResponse(
        String id,
        String name,
        String cover,
        String type,
        String status,
        boolean adult,
        List<String> roles
) {
}

package com.toonlira.presentation.search.dto;

import java.util.List;

import com.toonlira.domain.search.valueobject.GlobalSearchEntityType;

public record GlobalSearchSectionResponse(
        GlobalSearchEntityType type,
        long totalElements,
        List<GlobalSearchResultResponse> items
) {
}

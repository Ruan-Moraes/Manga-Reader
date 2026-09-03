package com.mangareader.presentation.search.dto;

import java.util.List;

import com.mangareader.domain.search.valueobject.GlobalSearchEntityType;

public record GlobalSearchSectionResponse(
        GlobalSearchEntityType type,
        long totalElements,
        List<GlobalSearchResultResponse> items
) {
}

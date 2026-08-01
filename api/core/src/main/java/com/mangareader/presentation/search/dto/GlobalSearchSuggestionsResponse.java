package com.mangareader.presentation.search.dto;

import java.util.List;

public record GlobalSearchSuggestionsResponse(
        List<GlobalSearchSectionResponse> sections,
        long totalElements
) {
}

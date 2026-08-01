package com.mangareader.presentation.search.mapper;

import com.mangareader.application.search.GlobalSearchResult;
import com.mangareader.application.search.GlobalSearchSection;
import com.mangareader.application.search.GlobalSearchSuggestions;
import com.mangareader.presentation.search.dto.GlobalSearchResultResponse;
import com.mangareader.presentation.search.dto.GlobalSearchSectionResponse;
import com.mangareader.presentation.search.dto.GlobalSearchSuggestionsResponse;

public final class GlobalSearchMapper {
    private GlobalSearchMapper() {
    }

    public static GlobalSearchResultResponse toResponse(GlobalSearchResult result) {
        return new GlobalSearchResultResponse(
                result.id(), result.slug(), result.entityType(), result.name(),
                result.image(), result.matchedBy(), result.matchedText(), result.roles(),
                result.workCount(), result.titleType(), result.status(), result.adult(),
                result.primaryContributor(), result.country());
    }

    public static GlobalSearchSectionResponse toResponse(GlobalSearchSection section) {
        return new GlobalSearchSectionResponse(
                section.type(), section.totalElements(),
                section.items().stream().map(GlobalSearchMapper::toResponse).toList());
    }

    public static GlobalSearchSuggestionsResponse toResponse(GlobalSearchSuggestions suggestions) {
        return new GlobalSearchSuggestionsResponse(
                suggestions.sections().stream().map(GlobalSearchMapper::toResponse).toList(),
                suggestions.totalElements());
    }
}

package com.toonlira.presentation.search.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.toonlira.domain.search.valueobject.GlobalSearchEntityType;
import com.toonlira.domain.search.valueobject.GlobalSearchMatchType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GlobalSearchResultResponse(
        String id,
        String slug,
        GlobalSearchEntityType entityType,
        String name,
        String image,
        GlobalSearchMatchType matchedBy,
        String matchedText,
        List<String> roles,
        long workCount,
        String titleType,
        String status,
        Boolean adult,
        String primaryContributor,
        String country
) {
}

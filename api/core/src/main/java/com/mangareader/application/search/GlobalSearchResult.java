package com.mangareader.application.search;

import java.util.List;

import com.mangareader.domain.search.valueobject.GlobalSearchEntityType;
import com.mangareader.domain.search.valueobject.GlobalSearchMatchType;

public record GlobalSearchResult(
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
        String country,
        int rank
) {
}

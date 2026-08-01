package com.mangareader.application.search;

import java.util.List;

import com.mangareader.domain.search.valueobject.GlobalSearchEntityType;

public record GlobalSearchSection(
        GlobalSearchEntityType type,
        long totalElements,
        List<GlobalSearchResult> items
) {
    public int bestRank() {
        return items.isEmpty() ? Integer.MAX_VALUE : items.getFirst().rank();
    }
}

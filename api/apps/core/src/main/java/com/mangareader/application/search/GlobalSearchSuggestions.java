package com.mangareader.application.search;

import java.util.List;

public record GlobalSearchSuggestions(
        List<GlobalSearchSection> sections,
        long totalElements
) {
}

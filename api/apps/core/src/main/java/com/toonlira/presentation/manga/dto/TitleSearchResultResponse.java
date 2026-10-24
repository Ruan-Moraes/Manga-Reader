package com.toonlira.presentation.manga.dto;

import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;

public record TitleSearchResultResponse(
        String id,
        String name,
        String alternateTitle,
        String cover,
        String type,
        String status,
        Integer chaptersCount,
        String latestChapterNumber,
        boolean adult,
        Double ratingAverage,
        Long ratingCount,
        String author,
        TitleSearchMatchType matchedBy,
        String matchedText
) {
}

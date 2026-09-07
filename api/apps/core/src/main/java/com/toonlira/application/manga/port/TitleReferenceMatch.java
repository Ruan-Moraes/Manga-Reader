package com.toonlira.application.manga.port;

import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;

public record TitleReferenceMatch(
        String titleId,
        TitleSearchMatchType type,
        String matchedText
) {
}

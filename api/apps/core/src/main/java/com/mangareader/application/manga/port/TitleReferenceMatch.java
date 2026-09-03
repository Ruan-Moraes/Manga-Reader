package com.mangareader.application.manga.port;

import com.mangareader.domain.manga.valueobject.TitleSearchMatchType;

public record TitleReferenceMatch(
        String titleId,
        TitleSearchMatchType type,
        String matchedText
) {
}

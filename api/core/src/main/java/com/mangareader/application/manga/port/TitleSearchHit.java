package com.mangareader.application.manga.port;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.TitleSearchMatchType;

public record TitleSearchHit(
        Title title,
        TitleSearchMatchType matchedBy,
        String matchedText
) {
}

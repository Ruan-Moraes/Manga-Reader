package com.toonlira.application.manga.port;

import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;

public record TitleSearchHit(
        Title title,
        TitleSearchMatchType matchedBy,
        String matchedText
) {
}

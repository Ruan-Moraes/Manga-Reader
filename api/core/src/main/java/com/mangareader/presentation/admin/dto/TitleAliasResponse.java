package com.mangareader.presentation.admin.dto;

import com.mangareader.domain.manga.valueobject.TitleAliasType;

public record TitleAliasResponse(
        String name,
        TitleAliasType type,
        String locale
) {
}

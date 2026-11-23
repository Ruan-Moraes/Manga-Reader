package com.toonlira.presentation.admin.dto;

import com.toonlira.domain.manga.valueobject.TitleAliasType;

public record TitleAliasResponse(
        String name,
        TitleAliasType type,
        String locale
) {
}

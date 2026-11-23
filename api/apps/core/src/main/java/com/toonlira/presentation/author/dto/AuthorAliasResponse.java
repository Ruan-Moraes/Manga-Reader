package com.toonlira.presentation.author.dto;

import com.toonlira.domain.author.valueobject.AuthorAliasType;

public record AuthorAliasResponse(
        Long id,
        String name,
        AuthorAliasType type
) {
}

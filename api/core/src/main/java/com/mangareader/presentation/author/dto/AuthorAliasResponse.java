package com.mangareader.presentation.author.dto;

import com.mangareader.domain.author.valueobject.AuthorAliasType;

public record AuthorAliasResponse(
        Long id,
        String name,
        AuthorAliasType type
) {
}

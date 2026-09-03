package com.mangareader.presentation.publisher.dto;

import com.mangareader.domain.publisher.valueobject.PublisherAliasType;

public record PublisherAliasResponse(
        Long id,
        String name,
        PublisherAliasType type
) {
}

package com.toonlira.presentation.publisher.dto;

import com.toonlira.domain.publisher.valueobject.PublisherAliasType;

public record PublisherAliasResponse(
        Long id,
        String name,
        PublisherAliasType type
) {
}

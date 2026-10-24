package com.toonlira.presentation.publisher.dto;

import com.toonlira.domain.publisher.valueobject.PublisherAliasType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PublisherAliasRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull PublisherAliasType type
) {
}

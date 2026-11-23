package com.toonlira.presentation.author.dto;

import com.toonlira.domain.author.valueobject.AuthorAliasType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AuthorAliasRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull AuthorAliasType type
) {
}

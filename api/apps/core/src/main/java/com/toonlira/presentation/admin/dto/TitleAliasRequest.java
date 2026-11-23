package com.toonlira.presentation.admin.dto;

import com.toonlira.domain.manga.valueobject.TitleAliasType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TitleAliasRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull TitleAliasType type,
        @Size(max = 35) String locale
) {
}

package com.mangareader.presentation.user.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record UpdateLanguagePreferencesRequest(
        @NotEmpty(message = "{validation.locale.required}")
        List<@NotBlank(message = "{validation.locale.required}") String> contentLocales
) {}

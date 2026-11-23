package com.toonlira.presentation.user.dto;

import java.util.List;

public record LanguagePreferencesResponse(
        List<String> contentLocales
) {}

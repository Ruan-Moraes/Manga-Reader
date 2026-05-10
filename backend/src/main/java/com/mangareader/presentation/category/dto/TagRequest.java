package com.mangareader.presentation.category.dto;

import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotNull;

/**
 * DTO de criação/atualização de tag.
 *
 * <p>Mapa BCP 47 → texto. {@code pt-BR} obrigatório (fallback).
 */
public record TagRequest(
        @NotNull
        @RequiredLanguages
        Map<String, String> label
) {}

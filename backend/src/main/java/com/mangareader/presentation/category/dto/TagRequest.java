package com.mangareader.presentation.category.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de criação/atualização de tag.
 *
 * <p>{@code label} (legado) é obrigatório — frontend deriva do slot pt-BR.
 * {@code labelI18n} (mapa BCP 47) é opcional; se presente, sobrescreve.
 */
public record TagRequest(
        @NotBlank @Size(max = 60) String label,
        Map<String, String> labelI18n
) {}

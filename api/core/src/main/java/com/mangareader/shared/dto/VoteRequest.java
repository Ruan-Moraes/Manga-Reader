package com.mangareader.shared.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request de voto. {@code value} aceita {@code "up"} ou {@code "down"}
 * (resolvido por {@code VoteValue.fromValue}).
 * <p>
 * Contrato único de voto da API, compartilhado por resenhas, comentários e
 * tópicos de fórum.
 */
public record VoteRequest(
        @NotBlank(message = "{validation.vote.value.required}")
        String value
) {}

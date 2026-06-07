package com.mangareader.presentation.rating.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request de voto em resenha. {@code value} aceita {@code "up"} ou
 * {@code "down"} (resolvido por {@code VoteValue.fromValue}). DT-45.
 */
public record ReviewVoteRequest(
        @NotBlank(message = "{validation.review.vote.required}")
        String value
) {}

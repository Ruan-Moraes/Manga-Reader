package com.mangareader.presentation.rating.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import com.mangareader.application.rating.usecase.ReviewVoteResult;

/**
 * Resposta dos endpoints de voto: contadores atualizados e o voto atual do
 * usuário ({@code "up"}/{@code "down"}/{@code null}). DT-45.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReviewVoteResponse(
        long upvotes,
        long downvotes,
        String myVote
) {
    public static ReviewVoteResponse from(ReviewVoteResult result) {
        return new ReviewVoteResponse(
                result.upvotes(),
                result.downvotes(),
                result.myVote() != null ? result.myVote().name().toLowerCase() : null
        );
    }
}

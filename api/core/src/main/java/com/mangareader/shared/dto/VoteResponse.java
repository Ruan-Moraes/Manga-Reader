package com.mangareader.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import com.mangareader.shared.application.vote.VoteResult;

/**
 * Resposta dos endpoints de voto: contadores atualizados e o voto atual do
 * usuário ({@code "up"}/{@code "down"}/{@code null}).
 * <p>
 * Contrato único de voto da API, compartilhado por resenhas, comentários e
 * tópicos de fórum.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record VoteResponse(
        long upvotes,
        long downvotes,
        String myVote
) {
    public static VoteResponse from(VoteResult result) {
        return new VoteResponse(
                result.upvotes(),
                result.downvotes(),
                result.myVote() != null ? result.myVote().name().toLowerCase() : null
        );
    }
}

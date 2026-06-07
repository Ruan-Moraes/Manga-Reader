package com.mangareader.application.rating.usecase;

import com.mangareader.domain.rating.valueobject.VoteValue;

/**
 * Resultado de uma operação de voto em resenha: contadores atualizados e o
 * voto atual do usuário ({@code null} quando não há voto). DT-45.
 */
public record ReviewVoteResult(long upvotes, long downvotes, VoteValue myVote) {}

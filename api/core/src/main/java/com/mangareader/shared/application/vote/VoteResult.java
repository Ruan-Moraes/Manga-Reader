package com.mangareader.shared.application.vote;

import com.mangareader.shared.domain.vote.VoteValue;

/**
 * Resultado de uma operação de voto: contadores atualizados e o voto atual do
 * usuário ({@code null} quando não há voto).
 * <p>
 * Compartilhado pelos use cases de voto de todos os domínios votáveis
 * (resenha, comentário, tópico de fórum).
 */
public record VoteResult(long upvotes, long downvotes, VoteValue myVote) {}

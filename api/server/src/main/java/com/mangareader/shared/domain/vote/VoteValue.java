package com.mangareader.shared.domain.vote;

/**
 * Valor de um voto — "Útil" (UP) ou "Contrário" (DOWN).
 * <p>
 * Modelo de voto único, compartilhado por todos os tipos votáveis (resenhas,
 * comentários e tópicos de fórum). Compatível com o frontend
 * ({@code myVote: 'up' | 'down'}).
 */
public enum VoteValue {
    UP,
    DOWN;

    /**
     * Resolve o valor a partir do nome do enum, case-insensitive
     * (aceita {@code "up"}/{@code "down"} vindos do frontend). Mantém o parsing
     * no domínio, fora dos controllers (padrão DT-39).
     */
    public static VoteValue fromValue(String value) {
        for (VoteValue vote : values()) {
            if (vote.name().equalsIgnoreCase(value)) {
                return vote;
            }
        }

        throw new IllegalArgumentException("Valor de voto inválido: " + value);
    }
}

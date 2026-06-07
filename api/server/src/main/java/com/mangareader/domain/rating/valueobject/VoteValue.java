package com.mangareader.domain.rating.valueobject;

/**
 * Valor de um voto em resenha — "Útil" (UP) ou "Contrário" (DOWN).
 * <p>
 * Compatível com o frontend ({@code myVote: 'up' | 'down'} em rating.types.ts).
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

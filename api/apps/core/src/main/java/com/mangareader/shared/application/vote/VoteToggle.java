package com.mangareader.shared.application.vote;

import com.mangareader.shared.domain.vote.HasVoteCounters;
import com.mangareader.shared.domain.vote.VoteValue;

/**
 * Regra de negócio única do voto-toggle, compartilhada por todos os domínios
 * votáveis (resenha, comentário, tópico de fórum):
 *
 * <ul>
 *   <li>sem voto anterior → cria o voto e incrementa o contador do lado votado;</li>
 *   <li>mesmo lado → remove o voto (toggle off) e decrementa;</li>
 *   <li>lado oposto → troca o voto, ajustando os dois contadores.</li>
 * </ul>
 *
 * O documento de voto em si é persistido pelo domínio via {@link VoteStore};
 * aqui ficam apenas a decisão e a aritmética dos contadores (que nunca ficam
 * negativos). Validações como bloqueio de self-vote permanecem em cada use case.
 */
public final class VoteToggle {

    /** Operações de persistência do documento de voto, fornecidas pelo use case. */
    public interface VoteStore {
        /** Não havia voto: criar o documento com o valor votado. */
        void create(VoteValue value);

        /** Havia voto do lado oposto: atualizar o documento para o novo valor. */
        void switchTo(VoteValue value);

        /** Toggle off: remover o documento de voto existente. */
        void delete();
    }

    private VoteToggle() {}

    /**
     * Aplica o toggle sobre o pai votável e delega a persistência do voto.
     *
     * @param existing valor do voto atual do usuário ({@code null} se não votou)
     * @return o voto resultante ({@code null} quando o toggle removeu o voto)
     */
    public static VoteValue apply(HasVoteCounters parent, VoteValue existing, VoteValue value, VoteStore store) {
        if (existing == null) {
            increment(parent, value, 1);
            store.create(value);
            return value;
        }

        if (existing == value) {
            increment(parent, value, -1);
            store.delete();
            return null;
        }

        increment(parent, existing, -1);
        increment(parent, value, 1);
        store.switchTo(value);
        return value;
    }

    /** Decrementa o contador do lado removido (remoção explícita de voto, idempotente no use case). */
    public static void undo(HasVoteCounters parent, VoteValue removed) {
        increment(parent, removed, -1);
    }

    private static void increment(HasVoteCounters parent, VoteValue value, long delta) {
        if (value == VoteValue.UP) {
            parent.setUpvotes(Math.max(0, parent.getUpvotes() + delta));
        } else {
            parent.setDownvotes(Math.max(0, parent.getDownvotes() + delta));
        }
    }
}

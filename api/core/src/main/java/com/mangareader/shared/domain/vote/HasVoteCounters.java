package com.mangareader.shared.domain.vote;

/**
 * Entidade votável: mantém os contadores desnormalizados {@code upvotes}/
 * {@code downvotes} para leitura barata na listagem.
 * <p>
 * Implementada pelos pais de voto (resenha, comentário e, futuramente, tópico
 * de fórum) — os getters/setters já existem via Lombok; basta declarar a
 * interface. Usada por {@link com.mangareader.shared.application.vote.VoteToggle}.
 */
public interface HasVoteCounters {
    long getUpvotes();

    void setUpvotes(long upvotes);

    long getDownvotes();

    void setDownvotes(long downvotes);
}

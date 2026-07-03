package com.mangareader.application.social.port;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Port do grafo social (DT-48). Implementado por adapter Neo4j — o grafo
 * guarda apenas nós mínimos {@code (:UserNode {userId})} e arestas
 * {@code [:FOLLOWS {since}]}; os dados do usuário continuam no Postgres
 * (fonte de verdade) e são hidratados pelos use cases.
 */
public interface SocialGraphPort {

    /** Cria os nós (lazy, MERGE) e a aresta follower→followee. Idempotente. */
    void follow(UUID followerId, UUID followeeId);

    /** Remove a aresta follower→followee, se existir. Idempotente. */
    void unfollow(UUID followerId, UUID followeeId);

    boolean isFollowing(UUID followerId, UUID followeeId);

    /**
     * Contagens do alvo + se o viewer o segue, em um único round-trip.
     * {@code viewerId} nulo (anônimo) ⇒ {@code followedByViewer=false}.
     */
    ProfileSocial getProfileSocial(UUID targetId, UUID viewerId);

    /** Quem segue {@code userId}, do follow mais recente ao mais antigo. */
    Page<UUID> listFollowers(UUID userId, Pageable pageable);

    /** Quem {@code userId} segue, do follow mais recente ao mais antigo. */
    Page<UUID> listFollowing(UUID userId, Pageable pageable);

    /** Apaga o nó do usuário e todas as suas arestas (delete de conta). */
    void removeUser(UUID userId);

    record ProfileSocial(long followers, long following, boolean followedByViewer) {
        public static ProfileSocial empty() {
            return new ProfileSocial(0, 0, false);
        }
    }
}

package com.mangareader.infrastructure.persistence.neo4j.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;
import com.mangareader.infrastructure.persistence.neo4j.Neo4jSchemaInitializer;
import com.mangareader.infrastructure.persistence.neo4j.Neo4jTestContainerConfig;

/**
 * Integração do adapter do grafo social contra Neo4j real (Testcontainers).
 * <p>
 * Transação de teste desligada ({@code NOT_SUPPORTED}): em produção cada
 * statement do adapter é auto-commit, e o Neo4j proíbe misturar schema
 * (constraint do setup) e escrita na mesma transação.
 */
@DataNeo4jTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({Neo4jTestContainerConfig.class, SocialGraphNeo4jAdapter.class})
@Tag("testcontainers")
@DisplayName("SocialGraphNeo4jAdapter (Neo4j via Testcontainers)")
class SocialGraphNeo4jAdapterTest {

    @Autowired
    private Neo4jClient neo4jClient;

    @Autowired
    private SocialGraphNeo4jAdapter adapter;

    private final UUID alice = UUID.randomUUID();
    private final UUID bob = UUID.randomUUID();
    private final UUID carol = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Constraint idempotente (em produção é criada pelo Neo4jSchemaInitializer)
        neo4jClient.query(Neo4jSchemaInitializer.USER_NODE_CONSTRAINT).run();
        neo4jClient.query("MATCH (n:UserNode) DETACH DELETE n").run();
    }

    @Test
    @DisplayName("follow cria nós lazy e aresta; idempotente (MERGE)")
    void followIdempotente() {
        adapter.follow(alice, bob);
        adapter.follow(alice, bob);

        assertThat(adapter.isFollowing(alice, bob)).isTrue();
        assertThat(adapter.isFollowing(bob, alice)).isFalse();

        ProfileSocial social = adapter.getProfileSocial(bob, alice);
        assertThat(social.followers()).isEqualTo(1);
        assertThat(social.following()).isZero();
        assertThat(social.followedByViewer()).isTrue();
    }

    @Test
    @DisplayName("unfollow remove a aresta; idempotente")
    void unfollowIdempotente() {
        adapter.follow(alice, bob);
        adapter.unfollow(alice, bob);
        adapter.unfollow(alice, bob);

        assertThat(adapter.isFollowing(alice, bob)).isFalse();
        assertThat(adapter.getProfileSocial(bob, alice).followers()).isZero();
    }

    @Test
    @DisplayName("getProfileSocial com viewer anônimo (null) e alvo sem nó")
    void profileSocialAnonimoEAlvoInexistente() {
        ProfileSocial semNo = adapter.getProfileSocial(carol, null);
        assertThat(semNo).isEqualTo(ProfileSocial.empty());

        adapter.follow(alice, bob);
        ProfileSocial anonimo = adapter.getProfileSocial(bob, null);
        assertThat(anonimo.followers()).isEqualTo(1);
        assertThat(anonimo.followedByViewer()).isFalse();
    }

    @Test
    @DisplayName("listFollowers/listFollowing paginados, mais recente primeiro")
    void listasPaginadas() {
        adapter.follow(bob, alice);
        adapter.follow(carol, alice);
        adapter.follow(alice, bob);
        adapter.follow(alice, carol);

        Page<UUID> followers = adapter.listFollowers(alice, PageRequest.of(0, 1));
        assertThat(followers.getTotalElements()).isEqualTo(2);
        assertThat(followers.getContent()).hasSize(1);

        Page<UUID> allFollowers = adapter.listFollowers(alice, PageRequest.of(0, 10));
        assertThat(allFollowers.getContent()).containsExactlyInAnyOrder(bob, carol);

        Page<UUID> following = adapter.listFollowing(alice, PageRequest.of(0, 10));
        assertThat(following.getContent()).containsExactlyInAnyOrder(bob, carol);
        assertThat(following.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("removeUser apaga nó e arestas nos dois sentidos")
    void removeUserDetachDelete() {
        adapter.follow(alice, bob);
        adapter.follow(carol, alice);

        adapter.removeUser(alice);

        assertThat(adapter.isFollowing(carol, alice)).isFalse();
        assertThat(adapter.getProfileSocial(bob, null).followers()).isZero();
        // Nós dos outros usuários permanecem
        assertThat(adapter.getProfileSocial(carol, null)).isEqualTo(ProfileSocial.empty());
    }
}

package com.mangareader.infrastructure.persistence.neo4j.adapter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Component;

import com.mangareader.application.social.port.SocialGraphPort;

import lombok.RequiredArgsConstructor;

/**
 * Adapter Neo4j do grafo social (DT-48) — Cypher explícito via Neo4jClient,
 * sem OGM. Cada operação é um statement único (auto-commit atômico); a
 * constraint de unicidade em {@code UserNode.userId} é criada no boot pelo
 * {@code Neo4jSchemaInitializer}.
 */
@Component
@RequiredArgsConstructor
public class SocialGraphNeo4jAdapter implements SocialGraphPort {

    private final Neo4jClient neo4jClient;

    @Override
    public void follow(UUID followerId, UUID followeeId) {
        neo4jClient.query("""
                MERGE (a:UserNode {userId: $followerId})
                MERGE (b:UserNode {userId: $followeeId})
                MERGE (a)-[r:FOLLOWS]->(b)
                ON CREATE SET r.since = datetime()
                """)
                .bindAll(Map.of("followerId", followerId.toString(), "followeeId", followeeId.toString()))
                .run();
    }

    @Override
    public void unfollow(UUID followerId, UUID followeeId) {
        neo4jClient.query("""
                MATCH (:UserNode {userId: $followerId})-[r:FOLLOWS]->(:UserNode {userId: $followeeId})
                DELETE r
                """)
                .bindAll(Map.of("followerId", followerId.toString(), "followeeId", followeeId.toString()))
                .run();
    }

    @Override
    public boolean isFollowing(UUID followerId, UUID followeeId) {
        return neo4jClient.query("""
                RETURN EXISTS {
                    MATCH (:UserNode {userId: $followerId})-[:FOLLOWS]->(:UserNode {userId: $followeeId})
                } AS following
                """)
                .bindAll(Map.of("followerId", followerId.toString(), "followeeId", followeeId.toString()))
                .fetchAs(Boolean.class)
                .one()
                .orElse(false);
    }

    @Override
    public ProfileSocial getProfileSocial(UUID targetId, UUID viewerId) {
        String viewer = viewerId != null ? viewerId.toString() : "";

        return neo4jClient.query("""
                OPTIONAL MATCH (target:UserNode {userId: $targetId})
                RETURN
                    COUNT { (target)<-[:FOLLOWS]-() } AS followers,
                    COUNT { (target)-[:FOLLOWS]->() } AS following,
                    EXISTS {
                        MATCH (:UserNode {userId: $viewerId})-[:FOLLOWS]->(target)
                    } AS followedByViewer
                """)
                .bindAll(Map.of("targetId", targetId.toString(), "viewerId", viewer))
                .fetchAs(ProfileSocial.class)
                .mappedBy((typeSystem, record) -> new ProfileSocial(
                        record.get("followers").asLong(0),
                        record.get("following").asLong(0),
                        record.get("followedByViewer").asBoolean(false)))
                .one()
                .orElse(ProfileSocial.empty());
    }

    @Override
    public Page<UUID> listFollowers(UUID userId, Pageable pageable) {
        List<UUID> ids = neo4jClient.query("""
                MATCH (follower:UserNode)-[r:FOLLOWS]->(:UserNode {userId: $userId})
                RETURN follower.userId AS id
                ORDER BY r.since DESC
                SKIP $skip LIMIT $limit
                """)
                .bindAll(pageParams(userId, pageable))
                .fetchAs(UUID.class)
                .mappedBy((typeSystem, record) -> UUID.fromString(record.get("id").asString()))
                .all()
                .stream()
                .toList();

        long total = countQuery("MATCH (:UserNode)-[r:FOLLOWS]->(:UserNode {userId: $userId}) RETURN count(r) AS total", userId);

        return new PageImpl<>(ids, pageable, total);
    }

    @Override
    public Page<UUID> listFollowing(UUID userId, Pageable pageable) {
        List<UUID> ids = neo4jClient.query("""
                MATCH (:UserNode {userId: $userId})-[r:FOLLOWS]->(followee:UserNode)
                RETURN followee.userId AS id
                ORDER BY r.since DESC
                SKIP $skip LIMIT $limit
                """)
                .bindAll(pageParams(userId, pageable))
                .fetchAs(UUID.class)
                .mappedBy((typeSystem, record) -> UUID.fromString(record.get("id").asString()))
                .all()
                .stream()
                .toList();

        long total = countQuery("MATCH (:UserNode {userId: $userId})-[r:FOLLOWS]->(:UserNode) RETURN count(r) AS total", userId);

        return new PageImpl<>(ids, pageable, total);
    }

    @Override
    public void removeUser(UUID userId) {
        neo4jClient.query("""
                MATCH (u:UserNode {userId: $userId})
                DETACH DELETE u
                """)
                .bindAll(Map.of("userId", userId.toString()))
                .run();
    }

    private Map<String, Object> pageParams(UUID userId, Pageable pageable) {
        return Map.of(
                "userId", userId.toString(),
                "skip", pageable.getOffset(),
                "limit", (long) pageable.getPageSize());
    }

    private long countQuery(String cypher, UUID userId) {
        return neo4jClient.query(cypher)
                .bindAll(Map.of("userId", userId.toString()))
                .fetchAs(Long.class)
                .one()
                .orElse(0L);
    }
}

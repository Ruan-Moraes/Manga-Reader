package com.mangareader.reconciler.infrastructure.mongo;

import static org.assertj.core.api.Assertions.assertThat;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.mangareader.testing.mongo.Mongo8TestContainerFactory;

/**
 * Integração Mongo (TestContainers) dos reconcilers de Mongo: reply count dos
 * tópicos e contadores de voto (incl. zeragem via {@code $nin}).
 */
@DataMongoTest(properties = "mongock.enabled=false")
@Import({ForumReplyCountReconciler.class, VoteCounterReconciler.class})
@Testcontainers
@Tag("testcontainers")
@DisplayName("Mongo reconcilers — IT")
class MongoReconcilersTest {
    @Container
    static MongoDBContainer mongo = Mongo8TestContainerFactory.create();

    @DynamicPropertySource
    static void mongoProps(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

    @Autowired private MongoTemplate mongoTemplate;
    @Autowired private ForumReplyCountReconciler forumReplyReconciler;
    @Autowired private VoteCounterReconciler voteReconciler;

    @BeforeEach
    void setUp() {
        for (String c : new String[] {"comments", "forum_topics", "comments_votes"}) {
            mongoTemplate.getCollection(c).drop();
        }
    }

    @Test
    @DisplayName("reconcile() do fórum corrige replyCount e zera tópico sem resposta")
    void reconcileReplyCount() {
        mongoTemplate.getCollection("forum_topics").insertOne(new Document("_id", "t1").append("replyCount", 99));
        mongoTemplate.getCollection("forum_topics").insertOne(new Document("_id", "t2").append("replyCount", 5));
        insertComment("t1");
        insertComment("t1");

        forumReplyReconciler.reconcile();

        assertThat(replyCount("t1")).isEqualTo(2L);
        assertThat(replyCount("t2")).isEqualTo(0L); // sem comentários → zerado
    }

    @Test
    @DisplayName("reconcileAll() corrige upvotes/downvotes e zera comentário sem voto")
    void reconcileVotes() {
        // c1 tem 2 UP + 1 DOWN; c2 está com contador podre e nenhum voto → deve zerar.
        mongoTemplate.getCollection("comments").insertOne(
                new Document("_id", "c1").append("upvotes", 0L).append("downvotes", 0L));
        mongoTemplate.getCollection("comments").insertOne(
                new Document("_id", "c2").append("upvotes", 7L).append("downvotes", 3L));
        insertVote("c1", "UP");
        insertVote("c1", "UP");
        insertVote("c1", "DOWN");

        voteReconciler.reconcileAll();

        Document c1 = comment("c1");
        assertThat(((Number) c1.get("upvotes")).longValue()).isEqualTo(2L);
        assertThat(((Number) c1.get("downvotes")).longValue()).isEqualTo(1L);

        Document c2 = comment("c2");
        assertThat(((Number) c2.get("upvotes")).longValue()).isEqualTo(0L);
        assertThat(((Number) c2.get("downvotes")).longValue()).isEqualTo(0L);
    }

    private void insertComment(String topicId) {
        mongoTemplate.getCollection("comments").insertOne(
                new Document("targetType", "FORUM_TOPIC").append("targetId", topicId));
    }

    private void insertVote(String commentId, String value) {
        mongoTemplate.getCollection("comments_votes").insertOne(
                new Document("commentId", commentId).append("value", value));
    }

    private long replyCount(String topicId) {
        return ((Number) topic(topicId).get("replyCount")).longValue();
    }

    private Document topic(String id) {
        return mongoTemplate.getCollection("forum_topics").find(new Document("_id", id)).first();
    }

    private Document comment(String id) {
        return mongoTemplate.getCollection("comments").find(new Document("_id", id)).first();
    }
}

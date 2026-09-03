package com.mangareader.infrastructure.persistence.mongo.migration;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.jdbc.core.JdbcTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — migração cross-DB do fórum: Postgres → MongoDB.
 *
 * <p>Tópicos ({@code forum_topics}) viram documentos Mongo com autor em
 * snapshot ({@code authorId}/{@code authorName}/{@code authorPhoto}) e voto
 * padronizado ({@code like_count} → {@code upvotes}). Respostas
 * ({@code forum_replies}) viram comentários unificados em {@code comments}
 * ({@code targetType=FORUM_TOPIC}; {@code likes} → {@code upvotes};
 * {@code is_best_answer} → {@code isHighlighted}).
 *
 * <p>Lê o Postgres por JDBC puro (sem depender de entidades JPA, já removidas)
 * e VERIFICA contagem origem == destino, abortando em divergência. As tabelas
 * Postgres NÃO são dropadas aqui — o drop (Flyway V33) é deploy separado,
 * após confirmação em produção (fase 2).
 *
 * <p>Idempotente: pula execução se {@code forum_topics} (Mongo) já tem dados;
 * precedente cross-collection em {@code V009MigrateChaptersToCollection}.
 */
@Slf4j
@ChangeUnit(id = "V016-migrate-forum-to-mongo", order = "016", author = "mangareader")
public class V016MigrateForumToMongo {
    private static final ObjectMapper JSON = new ObjectMapper();

    private final MongoTemplate mongoTemplate;
    private final JdbcTemplate jdbcTemplate;

    public V016MigrateForumToMongo(MongoTemplate mongoTemplate, JdbcTemplate jdbcTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Execution
    public void execute() {
        createIndexes();

        if (!forumTablesExist()) {
            log.info("V016 — tabelas Postgres do fórum ausentes; nada a migrar.");
            return;
        }

        if (mongoTemplate.getCollection("forum_topics").countDocuments() > 0) {
            log.info("V016 — forum_topics (Mongo) já populada; migração ignorada.");
            return;
        }

        long migratedTopics = migrateTopics();
        long migratedReplies = migrateReplies();

        verifyCounts(migratedTopics, migratedReplies);

        log.info("V016 — fórum migrado para o Mongo: {} tópicos, {} respostas (comments).",
                migratedTopics, migratedReplies);
    }

    private boolean forumTablesExist() {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_topics')",
                Boolean.class);

        return Boolean.TRUE.equals(exists);
    }

    private long migrateTopics() {
        List<Document> docs = jdbcTemplate.query("""
                SELECT t.id, t.author_id, u.name AS author_name, u.photo_url AS author_photo,
                       t.title, t.content, t.category, t.tags, t.language,
                       t.view_count, t.reply_count, t.like_count,
                       t.is_pinned, t.is_locked, t.is_solved, t.edited,
                       t.created_at, t.last_activity_at, t.updated_at
                FROM forum_topics t
                JOIN users u ON u.id = t.author_id
                """, (rs, i) -> topicDocument(rs));

        if (!docs.isEmpty()) {
            mongoTemplate.getCollection("forum_topics").insertMany(docs);
        }

        return docs.size();
    }

    private long migrateReplies() {
        List<Document> docs = jdbcTemplate.query("""
                SELECT r.id, r.topic_id, r.author_id, u.name AS author_name, u.photo_url AS author_photo,
                       r.content, r.language, r.likes, r.edited, r.is_best_answer,
                       r.created_at, r.updated_at
                FROM forum_replies r
                JOIN users u ON u.id = r.author_id
                """, (rs, i) -> replyDocument(rs));

        if (!docs.isEmpty()) {
            mongoTemplate.getCollection("comments").insertMany(docs);
        }

        return docs.size();
    }

    private Document topicDocument(ResultSet rs) throws SQLException {
        return new Document("_id", rs.getString("id"))
                .append("authorId", rs.getString("author_id"))
                .append("authorName", rs.getString("author_name"))
                .append("authorPhoto", rs.getString("author_photo"))
                .append("title", rs.getString("title"))
                .append("content", rs.getString("content"))
                .append("category", rs.getString("category"))
                .append("tags", parseTags(rs.getString("tags")))
                .append("language", rs.getString("language"))
                .append("viewCount", rs.getInt("view_count"))
                .append("replyCount", rs.getLong("reply_count"))
                .append("upvotes", rs.getLong("like_count"))
                .append("downvotes", 0L)
                .append("isPinned", rs.getBoolean("is_pinned"))
                .append("isLocked", rs.getBoolean("is_locked"))
                .append("isSolved", rs.getBoolean("is_solved"))
                .append("edited", rs.getBoolean("edited"))
                .append("createdAt", toDate(rs.getTimestamp("created_at")))
                .append("lastActivityAt", toDate(rs.getTimestamp("last_activity_at")))
                .append("updatedAt", toDate(rs.getTimestamp("updated_at")))
                .append("_class", "com.mangareader.domain.forum.entity.ForumTopic");
    }

    private Document replyDocument(ResultSet rs) throws SQLException {
        return new Document("_id", rs.getString("id"))
                .append("targetType", "FORUM_TOPIC")
                .append("targetId", rs.getString("topic_id"))
                .append("parentCommentId", null)
                .append("userId", rs.getString("author_id"))
                .append("userName", rs.getString("author_name"))
                .append("userPhoto", rs.getString("author_photo"))
                .append("textContent", rs.getString("content"))
                .append("language", rs.getString("language"))
                .append("upvotes", rs.getLong("likes"))
                .append("downvotes", 0L)
                .append("isHighlighted", rs.getBoolean("is_best_answer"))
                .append("edited", rs.getBoolean("edited"))
                .append("createdAt", toDate(rs.getTimestamp("created_at")))
                .append("updatedAt", toDate(rs.getTimestamp("updated_at")))
                .append("_class", "com.mangareader.domain.comment.entity.Comment");
    }

    private void verifyCounts(long migratedTopics, long migratedReplies) {
        Long pgTopics = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM forum_topics", Long.class);
        Long pgReplies = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM forum_replies", Long.class);

        if (pgTopics == null || pgTopics != migratedTopics || pgReplies == null || pgReplies != migratedReplies) {
            throw new IllegalStateException(
                    "V016 — contagem divergente (topics PG=%s/Mongo=%d, replies PG=%s/Mongo=%d); migração abortada"
                            .formatted(pgTopics, migratedTopics, pgReplies, migratedReplies));
        }
    }

    private void createIndexes() {
        var topics = mongoTemplate.indexOps("forum_topics");
        topics.ensureIndex(new CompoundIndexDefinition(
                new Document("category", 1).append("language", 1).append("createdAt", -1))
                .named("idx_forum_topics_category_language"));
        topics.ensureIndex(new CompoundIndexDefinition(
                new Document("language", 1).append("createdAt", -1))
                .named("idx_forum_topics_language"));
        topics.ensureIndex(new Index().on("authorId", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_forum_topics_authorId"));

        mongoTemplate.indexOps("forum_topics_votes").ensureIndex(new CompoundIndexDefinition(
                new Document("topicId", 1).append("userId", 1))
                .unique().named("idx_forum_topics_votes_topic_user"));
    }

    private static List<String> parseTags(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            return JSON.readerForListOf(String.class).readValue(json);
        } catch (JsonProcessingException e) {
            log.warn("V016 — tags jsonb ilegível ({}); usando lista vazia", e.getMessage());
            return List.of();
        }
    }

    private static LocalDateTime toDate(Timestamp ts) {
        return ts != null ? ts.toLocalDateTime() : null;
    }

    @RollbackExecution
    public void rollback() {
        // Backfill aditivo: origem Postgres permanece intacta até a fase 2 (V33).
        mongoTemplate.getCollection("forum_topics").drop();
        mongoTemplate.getCollection("comments").deleteMany(new Document("targetType", "FORUM_TOPIC"));
    }
}

package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import com.mongodb.MongoNamespace;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — modelo de comentário unificado + voto padronizado.
 *
 * <p>(1) {@code comments}: define {@code targetType="TITLE"} onde ausente,
 * renomeia {@code titleId} → {@code targetId} e os contadores
 * {@code likeCount}/{@code dislikeCount} → {@code upvotes}/{@code downvotes}.
 *
 * <p>(2) {@code comment_reactions} → {@code comments_votes}: converte
 * {@code reactionType} (LIKE/DISLIKE) no campo padronizado {@code value}
 * (UP/DOWN), renomeia a coleção e cria o índice único {@code commentId+userId}.
 *
 * <p>Idempotente: cada passo só toca documentos/coleções ainda não migrados.
 */
@Slf4j
@ChangeUnit(id = "V015-unify-comment-votes", order = "015", author = "mangareader")
public class V015UnifyCommentVotes {
    private final MongoTemplate mongoTemplate;

    public V015UnifyCommentVotes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var comments = mongoTemplate.getCollection("comments");

        // targetType=TITLE onde ausente (todo comentário legado era de obra/título)
        comments.updateMany(
                new Document("targetType", new Document("$exists", false)),
                new Document("$set", new Document("targetType", "TITLE")));

        // titleId -> targetId
        comments.updateMany(
                new Document("titleId", new Document("$exists", true)),
                new Document("$rename", new Document("titleId", "targetId")));

        // likeCount -> upvotes ; dislikeCount -> downvotes
        comments.updateMany(
                new Document("likeCount", new Document("$exists", true)),
                new Document("$rename", new Document("likeCount", "upvotes")));
        comments.updateMany(
                new Document("dislikeCount", new Document("$exists", true)),
                new Document("$rename", new Document("dislikeCount", "downvotes")));

        // comment_reactions: reactionType -> value (UP/DOWN)
        if (mongoTemplate.collectionExists("comment_reactions")) {
            var reactions = mongoTemplate.getCollection("comment_reactions");
            reactions.updateMany(new Document("reactionType", "LIKE"),
                    new Document("$set", new Document("value", "UP")));
            reactions.updateMany(new Document("reactionType", "DISLIKE"),
                    new Document("$set", new Document("value", "DOWN")));
            reactions.updateMany(new Document("reactionType", new Document("$exists", true)),
                    new Document("$unset", new Document("reactionType", "")));

            if (!mongoTemplate.collectionExists("comments_votes")) {
                String db = mongoTemplate.getDb().getName();
                reactions.renameCollection(new MongoNamespace(db, "comments_votes"));
            }
        }

        // índice único do modelo de voto
        var def = new Document("commentId", 1).append("userId", 1);
        mongoTemplate.indexOps("comments_votes").ensureIndex(
                new CompoundIndexDefinition(def).unique().named("idx_comment_vote_comment_user"));

        log.info("V015 — comments unificados (targetType/targetId, upvotes/downvotes) e comments_votes criados");
    }

    @RollbackExecution
    public void rollback() {
        var comments = mongoTemplate.getCollection("comments");
        comments.updateMany(new Document("targetId", new Document("$exists", true)),
                new Document("$rename", new Document("targetId", "titleId")));
        comments.updateMany(new Document("upvotes", new Document("$exists", true)),
                new Document("$rename", new Document("upvotes", "likeCount")));
        comments.updateMany(new Document("downvotes", new Document("$exists", true)),
                new Document("$rename", new Document("downvotes", "dislikeCount")));
    }
}

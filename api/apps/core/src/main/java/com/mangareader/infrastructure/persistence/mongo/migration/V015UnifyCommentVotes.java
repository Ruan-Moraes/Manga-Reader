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
 * Como {@code $rename} NÃO atualiza índices, dropa o índice morto
 * {@code idx_comments_titleId} (V001) e cria
 * {@code idx_comments_target_language} em
 * {@code {targetType, targetId, language, createdAt desc}} — cobre a listagem
 * particionada por idioma com sort por data. {@code idx_comments_parentCommentId}
 * e {@code idx_comments_userId} (V001) continuam válidos.
 *
 * <p>(2) {@code comment_reactions} → {@code comments_votes}: converte
 * {@code reactionType} (LIKE/DISLIKE) no campo padronizado {@code value}
 * (UP/DOWN) e renomeia a coleção. O rename de coleção carrega os índices junto:
 * o único composto {@code {commentId, userId}} (V003) é renomeado para
 * {@code idx_comments_votes_comment_user}; os índices simples de
 * {@code commentId} (prefixo do composto — redundante) e {@code userId}
 * (sem query) são dropados.
 *
 * <p>Idempotente: cada passo só toca documentos/coleções/índices ainda não
 * migrados.
 */
@Slf4j
@ChangeUnit(id = "V015-unify-comment-votes", order = "015", author = "mangareader")
public class V015UnifyCommentVotes {
    private static final String COMMENTS = "comments";
    private static final String VOTES_SOURCE = "comment_reactions";
    private static final String VOTES_TARGET = "comments_votes";

    private final MongoTemplate mongoTemplate;

    public V015UnifyCommentVotes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        migrateCommentDocuments();
        migrateCommentIndexes();
        migrateVotesCollection();
        migrateVoteIndexes();

        log.info("V015 — comments unificados (targetType/targetId, upvotes/downvotes) e comments_votes padronizada");
    }

    private void migrateCommentDocuments() {
        var comments = mongoTemplate.getCollection(COMMENTS);

        // targetType=TITLE onde ausente (todo comentário legado era de obra/título)
        comments.updateMany(
                new Document("targetType", new Document("$exists", false)),
                new Document("$set", new Document("targetType", "TITLE")));

        comments.updateMany(
                new Document("titleId", new Document("$exists", true)),
                new Document("$rename", new Document("titleId", "targetId")));

        comments.updateMany(
                new Document("likeCount", new Document("$exists", true)),
                new Document("$rename", new Document("likeCount", "upvotes")));
        comments.updateMany(
                new Document("dislikeCount", new Document("$exists", true)),
                new Document("$rename", new Document("dislikeCount", "downvotes")));
    }

    private void migrateCommentIndexes() {
        var ops = mongoTemplate.indexOps(COMMENTS);

        dropIndexIfExists(COMMENTS, "idx_comments_titleId");

        var listing = new Document("targetType", 1)
                .append("targetId", 1)
                .append("language", 1)
                .append("createdAt", -1);
        ops.ensureIndex(new CompoundIndexDefinition(listing).named("idx_comments_target_language"));
    }

    private void migrateVotesCollection() {
        if (!mongoTemplate.collectionExists(VOTES_SOURCE)) {
            return;
        }

        var reactions = mongoTemplate.getCollection(VOTES_SOURCE);
        reactions.updateMany(new Document("reactionType", "LIKE"),
                new Document("$set", new Document("value", "UP")));
        reactions.updateMany(new Document("reactionType", "DISLIKE"),
                new Document("$set", new Document("value", "DOWN")));
        reactions.updateMany(new Document("reactionType", new Document("$exists", true)),
                new Document("$unset", new Document("reactionType", "")));

        if (!mongoTemplate.collectionExists(VOTES_TARGET)) {
            String db = mongoTemplate.getDb().getName();
            reactions.renameCollection(new MongoNamespace(db, VOTES_TARGET));
        }
    }

    private void migrateVoteIndexes() {
        // No fluxo normal a coleção sempre existe aqui (V003 cria comment_reactions,
        // que migrateVotesCollection renomeia para comments_votes). Este guard é só
        // uma rede de segurança: sem ele, ensureIndex criaria uma comments_votes vazia
        // caso a coleção tenha sido dropada manualmente ou as migrations rodem fora de ordem.
        if (!mongoTemplate.collectionExists(VOTES_TARGET)) {
            return;
        }

        // Índices simples herdados de V003: commentId é prefixo do composto único
        // (redundante) e userId não atende query nenhuma.
        dropIndexIfExists(VOTES_TARGET, "idx_comment_reactions_commentId");
        dropIndexIfExists(VOTES_TARGET, "idx_comment_reactions_userId");

        // Renomeia o único composto herdado para a convenção da coleção nova.
        // Drop antes do create: mesmas chaves com nome diferente disparam
        // IndexOptionsConflict (erro 85) no MongoDB.
        dropIndexIfExists(VOTES_TARGET, "idx_comment_reaction_comment_user");

        var unique = new Document("commentId", 1).append("userId", 1);
        mongoTemplate.indexOps(VOTES_TARGET).ensureIndex(
                new CompoundIndexDefinition(unique).unique().named("idx_comments_votes_comment_user"));
    }

    private void dropIndexIfExists(String collection, String indexName) {
        var ops = mongoTemplate.indexOps(collection);
        boolean exists = ops.getIndexInfo().stream().anyMatch(idx -> indexName.equals(idx.getName()));

        if (exists) {
            ops.dropIndex(indexName);
        }
    }

    /**
     * Rollback simétrico ao {@link #execute()}: desfaz tanto os renames de campo
     * em {@code comments} quanto a padronização de votos (coleção + campo
     * {@code value}). Idempotente — cada passo só toca o que ainda está migrado.
     * O {@code targetType="TITLE"} setado no execute não é revertido de propósito:
     * não há como saber em quais documentos o campo era originalmente ausente, e
     * mantê-lo é inofensivo.
     */
    @RollbackExecution
    public void rollback() {
        // (1) comments: desfaz renames de campo e remove o índice novo.
        var comments = mongoTemplate.getCollection(COMMENTS);
        comments.updateMany(new Document("targetId", new Document("$exists", true)),
                new Document("$rename", new Document("targetId", "titleId")));
        comments.updateMany(new Document("upvotes", new Document("$exists", true)),
                new Document("$rename", new Document("upvotes", "likeCount")));
        comments.updateMany(new Document("downvotes", new Document("$exists", true)),
                new Document("$rename", new Document("downvotes", "dislikeCount")));
        dropIndexIfExists(COMMENTS, "idx_comments_target_language");

        // (2) comments_votes -> comment_reactions: reconverte value -> reactionType
        // e renomeia a coleção de volta, deixando o schema legível pelo código antigo.
        if (mongoTemplate.collectionExists(VOTES_TARGET)) {
            var votes = mongoTemplate.getCollection(VOTES_TARGET);
            votes.updateMany(new Document("value", "UP"),
                    new Document("$set", new Document("reactionType", "LIKE")));
            votes.updateMany(new Document("value", "DOWN"),
                    new Document("$set", new Document("reactionType", "DISLIKE")));
            votes.updateMany(new Document("value", new Document("$exists", true)),
                    new Document("$unset", new Document("value", "")));

            if (!mongoTemplate.collectionExists(VOTES_SOURCE)) {
                String db = mongoTemplate.getDb().getName();
                votes.renameCollection(new MongoNamespace(db, VOTES_SOURCE));
            }
        }
    }
}

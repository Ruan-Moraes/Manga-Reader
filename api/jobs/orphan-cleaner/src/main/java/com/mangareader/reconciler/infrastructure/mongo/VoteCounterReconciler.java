package com.mangareader.reconciler.infrastructure.mongo;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Reconcilia {@code <pai>.upvotes/downvotes = COUNT(votos UP/DOWN do pai)} para
 * os três pais votáveis (modelo de voto único).
 * <p>
 * Por pai: uma agregação na coleção de votos + bulk update nos pais votados;
 * pais sem voto algum mas com contador {@code > 0} são zerados via {@code $nin}
 * (sem carregar todos os ids do pai em memória — importante para {@code comments}).
 */
@Component
@RequiredArgsConstructor
public class VoteCounterReconciler {
    private static final String VOTE_VALUE = "value";
    private static final String UP = "UP";
    private static final String DOWN = "DOWN";
    private static final String UPVOTES = "upvotes";
    private static final String DOWNVOTES = "downvotes";

    /** Pares (coleção de votos, campo do id do pai, coleção do pai) reconciliados. */
    static final List<VotableParent> VOTABLE_PARENTS = List.of(
            new VotableParent("comments_votes", "commentId", "comments"),
            new VotableParent("reviews_votes", "ratingId", "reviews"),
            new VotableParent("forum_topics_votes", "topicId", "forum_topics"));

    record VotableParent(String votesCollection, String parentIdField, String parentCollection) {}

    private record VoteCounts(long up, long down) {}

    private final MongoTemplate mongoTemplate;

    /**
     * Reconcilia os contadores de voto de todos os pais votáveis.
     *
     * @return mapa {@code coleção do pai -> documentos modificados}.
     */
    public Map<String, Long> reconcileAll() {
        Map<String, Long> modifiedByParent = new LinkedHashMap<>();

        for (VotableParent parent : VOTABLE_PARENTS) {
            modifiedByParent.put(parent.parentCollection(), reconcile(parent));
        }

        return modifiedByParent;
    }

    private long reconcile(VotableParent parent) {
        Map<Object, VoteCounts> byParent = new HashMap<>();

        mongoTemplate.getCollection(parent.votesCollection())
                .aggregate(List.of(new Document("$group", new Document("_id", "$" + parent.parentIdField())
                        .append("up", conditionalSum(UP))
                        .append("down", conditionalSum(DOWN)))))
                .forEach(doc -> byParent.put(
                        toParentId(doc.get("_id")),
                        new VoteCounts(((Number) doc.get("up")).longValue(), ((Number) doc.get("down")).longValue())));

        long modified = 0;

        if (!byParent.isEmpty()) {
            BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, parent.parentCollection());

            byParent.forEach((id, counts) -> bulk.updateOne(
                    new Query(Criteria.where("_id").is(id)),
                    new Update().set(UPVOTES, counts.up()).set(DOWNVOTES, counts.down())));

            modified += bulk.execute().getModifiedCount();
        }

        modified += mongoTemplate.getCollection(parent.parentCollection()).updateMany(
                new Document("_id", new Document("$nin", List.copyOf(byParent.keySet())))
                        .append("$or", List.of(
                                new Document(UPVOTES, new Document("$gt", 0)),
                                new Document(DOWNVOTES, new Document("$gt", 0)))),
                new Document("$set", new Document(UPVOTES, 0L).append(DOWNVOTES, 0L)))
                .getModifiedCount();

        return modified;
    }

    private static Document conditionalSum(String voteValue) {
        return new Document("$sum",
                new Document("$cond", List.of(new Document("$eq", List.of("$" + VOTE_VALUE, voteValue)), 1, 0)));
    }

    /**
     * Os votos guardam o id do pai como String; o {@code _id} do pai pode ser
     * ObjectId (documentos criados pela app) ou String (seeds/UUIDs migrados do
     * Postgres). Converte hex válido para ObjectId para o update casar.
     */
    private static Object toParentId(Object raw) {
        if (raw instanceof String s && ObjectId.isValid(s)) {
            return new ObjectId(s);
        }

        return raw;
    }
}

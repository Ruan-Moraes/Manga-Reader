package com.mangareader.infrastructure.scheduling;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.infrastructure.persistence.postgres.repository.EventJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.GroupJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PERF-6: rede de segurança contra drift dos contadores desnormalizados.
 * <p>
 * Os use cases mantêm os contadores por incremento; este job recalcula
 * periodicamente cada contador a partir de sua fonte (bulk update idempotente
 * {@code SET = COUNT}), corrigindo divergências sem risco de double-count.
 * <p>
 * Postgres: {@code groups.totalTitles} e {@code events.participants}.
 * Mongo: {@code forum_topics.replyCount} a partir de {@code comments}
 * (comentário unificado) e {@code upvotes}/{@code downvotes} dos três pais
 * votáveis a partir das coleções {@code <pai>_votes} (modelo de voto único).
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class CounterReconciliationJob {
    private final GroupJpaRepository groups;
    private final EventJpaRepository events;
    private final MongoTemplate mongoTemplate;

    /** De hora em hora (no minuto 0). */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void reconcile() {
        int grps = groups.reconcileTotalTitles();
        int evts = events.reconcileParticipants();
        long topics = reconcileForumReplyCounts();

        long commentVotes = reconcileVoteCounters("comments_votes", "commentId", "comments");
        long reviewVotes = reconcileVoteCounters("reviews_votes", "ratingId", "ratings");
        long topicVotes = reconcileVoteCounters("forum_topics_votes", "topicId", "forum_topics");

        log.info("Reconciliação de contadores: groups={}, events={}, forum_topics(replyCount)={}, "
                        + "votos(comments={}, ratings={}, forum_topics={})",
                grps, evts, topics, commentVotes, reviewVotes, topicVotes);
    }

    /**
     * {@code forum_topics.replyCount = COUNT(comments do tópico)}. Uma agregação
     * em {@code comments} + um bulk update em {@code forum_topics}; tópicos sem
     * resposta voltam a 0.
     */
    private long reconcileForumReplyCounts() {
        Map<String, Long> countsByTopic = new HashMap<>();

        mongoTemplate.getCollection("comments")
                .aggregate(List.of(
                        new Document("$match", new Document("targetType", "FORUM_TOPIC")),
                        new Document("$group", new Document("_id", "$targetId")
                                .append("count", new Document("$sum", 1)))))
                .forEach(doc -> countsByTopic.put(doc.get("_id").toString(), doc.getInteger("count").longValue()));

        var topicIds = mongoTemplate.findDistinct(new Query(), "_id", "forum_topics", Object.class);

        if (topicIds.isEmpty()) {
            return 0;
        }

        BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "forum_topics");

        for (Object id : topicIds) {
            long count = countsByTopic.getOrDefault(id.toString(), 0L);

            bulk.updateOne(new Query(Criteria.where("_id").is(id)), new Update().set("replyCount", count));
        }

        return bulk.execute().getModifiedCount();
    }

    /**
     * {@code <pai>.upvotes/downvotes = COUNT(votos UP/DOWN do pai)}.
     * <p>
     * Uma agregação na coleção de votos + bulk update nos pais votados; pais sem
     * voto algum mas com contador > 0 são zerados via {@code $nin} (sem carregar
     * todos os ids do pai em memória — importante para {@code comments}).
     */
    private long reconcileVoteCounters(String votesCollection, String parentIdField, String parentCollection) {
        record VoteCounts(long up, long down) {}
        Map<Object, VoteCounts> byParent = new HashMap<>();

        mongoTemplate.getCollection(votesCollection)
                .aggregate(List.of(new Document("$group", new Document("_id", "$" + parentIdField)
                        .append("up", conditionalSum("UP"))
                        .append("down", conditionalSum("DOWN")))))
                .forEach(doc -> byParent.put(
                        toParentId(doc.get("_id")),
                        new VoteCounts(((Number) doc.get("up")).longValue(), ((Number) doc.get("down")).longValue())));

        long modified = 0;

        if (!byParent.isEmpty()) {
            BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, parentCollection);

            byParent.forEach((id, counts) -> bulk.updateOne(
                    new Query(Criteria.where("_id").is(id)),
                    new Update().set("upvotes", counts.up()).set("downvotes", counts.down())));

            modified += bulk.execute().getModifiedCount();
        }

        modified += mongoTemplate.getCollection(parentCollection).updateMany(
                new Document("_id", new Document("$nin", List.copyOf(byParent.keySet())))
                        .append("$or", List.of(
                                new Document("upvotes", new Document("$gt", 0)),
                                new Document("downvotes", new Document("$gt", 0)))),
                new Document("$set", new Document("upvotes", 0L).append("downvotes", 0L)))
                .getModifiedCount();

        return modified;
    }

    private static Document conditionalSum(String voteValue) {
        return new Document("$sum",
                new Document("$cond", List.of(new Document("$eq", List.of("$value", voteValue)), 1, 0)));
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

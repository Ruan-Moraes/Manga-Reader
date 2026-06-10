package com.mangareader.infrastructure.scheduling;

import java.util.HashMap;
import java.util.Map;

import org.bson.Document;
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
 * ({@code targetType=FORUM_TOPIC}) — modelo de comentário unificado.
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

        log.info("Reconciliação de contadores: groups={}, events={}, forum_topics={}", grps, evts, topics);
    }

    /**
     * {@code forum_topics.replyCount = COUNT(comments do tópico)}. Uma agregação
     * em {@code comments} + um bulk update em {@code forum_topics}; tópicos sem
     * resposta voltam a 0.
     */
    private long reconcileForumReplyCounts() {
        Map<String, Long> countsByTopic = new HashMap<>();

        mongoTemplate.getCollection("comments")
                .aggregate(java.util.List.of(
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
}

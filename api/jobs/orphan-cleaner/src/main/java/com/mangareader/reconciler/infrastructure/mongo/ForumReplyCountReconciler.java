package com.mangareader.reconciler.infrastructure.mongo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Reconcilia {@code forum_topics.replyCount = COUNT(comments do tópico)}.
 * <p>
 * Uma agregação em {@code comments} (modelo de comentário unificado, filtrado
 * por {@code targetType = FORUM_TOPIC}) + um bulk update em {@code forum_topics};
 * tópicos sem resposta voltam a 0.
 */
@Component
@RequiredArgsConstructor
public class ForumReplyCountReconciler {
    private static final String COMMENTS = "comments";
    private static final String FORUM_TOPICS = "forum_topics";
    private static final String TARGET_TYPE = "targetType";
    private static final String TARGET_ID = "targetId";
    private static final String FORUM_TOPIC = "FORUM_TOPIC";
    private static final String REPLY_COUNT = "replyCount";

    private final MongoTemplate mongoTemplate;

    /** Recalcula o {@code replyCount} de todos os tópicos. Retorna documentos modificados. */
    public long reconcile() {
        Map<String, Long> countsByTopic = new HashMap<>();

        mongoTemplate.getCollection(COMMENTS)
                .aggregate(List.of(
                        new Document("$match", new Document(TARGET_TYPE, FORUM_TOPIC)),
                        new Document("$group", new Document("_id", "$" + TARGET_ID)
                                .append("count", new Document("$sum", 1)))))
                .forEach(doc -> countsByTopic.put(doc.get("_id").toString(), doc.getInteger("count").longValue()));

        var topicIds = mongoTemplate.findDistinct(new Query(), "_id", FORUM_TOPICS, Object.class);

        if (topicIds.isEmpty()) {
            return 0;
        }

        BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, FORUM_TOPICS);

        for (Object id : topicIds) {
            long count = countsByTopic.getOrDefault(id.toString(), 0L);

            bulk.updateOne(new Query(Criteria.where("_id").is(id)), new Update().set(REPLY_COUNT, count));
        }

        return bulk.execute().getModifiedCount();
    }
}

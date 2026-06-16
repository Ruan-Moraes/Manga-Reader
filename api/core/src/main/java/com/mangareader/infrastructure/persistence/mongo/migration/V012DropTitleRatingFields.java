package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.client.model.UpdateOptions;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Remove campos de rating desnormalizados e mortos de {@code titles}:
 * {@code ratingAverage}, {@code ratingCount}, {@code rankingScore}.
 *
 * <p>Motivo: nenhum writer no monolito os mantinha; nota/contagem/ranking vêm
 * exclusivamente do agregado {@code title_rating_aggregate} (serviço
 * {@code rating-aggregator}). Manter os campos só gerava divergência/stale.
 *
 * <p>Idempotente — {@code $unset} em campos ausentes é no-op.
 */
@ChangeUnit(id = "V012-drop-title-rating-fields", order = "012", author = "mangareader")
public class V012DropTitleRatingFields {
    private final MongoTemplate mongoTemplate;

    public V012DropTitleRatingFields(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var unset = new Document("$unset", new Document()
                .append("ratingAverage", "")
                .append("ratingCount", "")
                .append("rankingScore", ""));

        mongoTemplate.getCollection("titles")
                .updateMany(new Document(), unset, new UpdateOptions());
    }

    @RollbackExecution
    public void rollback() {
        // Não suportado — valores eram stale; reconstrução não faz sentido.
    }
}

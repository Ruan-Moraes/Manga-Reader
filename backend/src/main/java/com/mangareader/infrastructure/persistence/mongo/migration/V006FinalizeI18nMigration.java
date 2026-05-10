package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.client.model.UpdateOptions;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Etapa B (i18n) — Fase B finalização para coleções MongoDB.
 *
 * <p>Renomeia campos {@code *I18n} para o nome canônico (sem sufixo) e
 * remove os campos legados monolíngues. Estado final: campo único com
 * nome simples e valor sendo o subdocumento i18n.
 *
 * <p>Idempotente: skip docs que já estão no formato final (sem campo
 * {@code *I18n}).
 */
@ChangeUnit(id = "V006-finalize-i18n-migration", order = "006", author = "mangareader")
public class V006FinalizeI18nMigration {

    private final MongoTemplate mongoTemplate;

    public V006FinalizeI18nMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        renameField("titles", "nameI18n", "name");
        renameField("titles", "synopsisI18n", "synopsis");

        renameField("news", "titleI18n", "title");
        renameField("news", "subtitleI18n", "subtitle");
        renameField("news", "excerptI18n", "excerpt");
        renameField("news", "contentI18n", "content");
    }

    @RollbackExecution
    public void rollback() {
        // Não suportado — perda de dados se reverter sem backup.
        // Para reverter, restore from snapshot.
    }

    /**
     * Substitui o valor do campo legado pelo conteúdo do campo i18n e
     * remove o campo i18n. Aplica apenas em docs que ainda têm o campo
     * i18n (idempotência).
     */
    private void renameField(String collection, String fromI18n, String toCanonical) {
        var coll = mongoTemplate.getCollection(collection);

        var pipeline = java.util.List.of(
                new Document("$set", new Document(toCanonical, "$" + fromI18n)),
                new Document("$unset", fromI18n));

        coll.updateMany(
                new Document(fromI18n, new Document("$exists", true)),
                pipeline,
                new UpdateOptions());
    }
}

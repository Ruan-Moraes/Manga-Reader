package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import com.mongodb.client.model.UpdateOptions;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Etapa 2 (i18n) — Fase A para coleções MongoDB de catálogo.
 *
 * <p>Adiciona subdocumentos {@code <campo>I18n} (mapa BCP 47 → texto) em
 * {@code titles} e {@code news} a partir dos campos monolíngues atuais.
 * Valores existentes são copiados para a chave {@code "pt-BR"}. Os campos
 * antigos são preservados (Fase A) e serão removidos em uma migração futura
 * após a refatoração dos use cases.
 *
 * <p>Também cria índices compostos por idioma para suportar busca/ordenação
 * em pt-BR, en-US e es-ES, substituindo o text index original que se tornará
 * insuficiente após a remoção dos campos planos.
 */
@ChangeUnit(id = "V004-localize-catalog-content", order = "004", author = "mangareader")
public class V004LocalizeCatalogContent {
    private static final String DEFAULT_TAG = "pt-BR";

    private final MongoTemplate mongoTemplate;

    public V004LocalizeCatalogContent(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        backfillTitles();
        backfillNews();
        createI18nIndexes();
    }

    @RollbackExecution
    public void rollback() {
        unsetField("titles", "nameI18n");
        unsetField("titles", "synopsisI18n");
        unsetField("news", "titleI18n");
        unsetField("news", "subtitleI18n");
        unsetField("news", "excerptI18n");
        unsetField("news", "contentI18n");

        dropIndexIfExists("titles", "idx_titles_name_ptBR");
        dropIndexIfExists("titles", "idx_titles_name_enUS");
        dropIndexIfExists("titles", "idx_titles_name_esES");
        dropIndexIfExists("news", "idx_news_title_ptBR");
        dropIndexIfExists("news", "idx_news_title_enUS");
        dropIndexIfExists("news", "idx_news_title_esES");
    }

    private void backfillTitles() {
        backfillStringField("titles", "name", "nameI18n");
        backfillStringField("titles", "synopsis", "synopsisI18n");
    }

    private void backfillNews() {
        backfillStringField("news", "title", "titleI18n");
        backfillStringField("news", "subtitle", "subtitleI18n");
        backfillStringField("news", "excerpt", "excerptI18n");
        backfillArrayField("news", "content", "contentI18n");
    }

    private void backfillStringField(String collection, String src, String dst) {
        var collectionRef = mongoTemplate.getCollection(collection);

        var pipeline = java.util.List.of(new Document("$set", new Document(dst,
                new Document("$cond", java.util.List.of(
                        new Document("$ifNull", java.util.List.of("$" + src, false)),
                        new Document(DEFAULT_TAG, "$" + src),
                        new Document())))));

        collectionRef.updateMany(new Document(), pipeline, new UpdateOptions());
    }

    private void backfillArrayField(String collection, String src, String dst) {
        var collectionRef = mongoTemplate.getCollection(collection);

        var pipeline = java.util.List.of(new Document("$set", new Document(dst,
                new Document("$cond", java.util.List.of(
                        new Document("$ifNull", java.util.List.of("$" + src, false)),
                        new Document(DEFAULT_TAG, "$" + src),
                        new Document())))));

        collectionRef.updateMany(new Document(), pipeline, new UpdateOptions());
    }

    private void createI18nIndexes() {
        var titlesOps = mongoTemplate.indexOps("titles");

        titlesOps.ensureIndex(new Index().on("nameI18n.pt-BR", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_titles_name_ptBR"));
        titlesOps.ensureIndex(new Index().on("nameI18n.en-US", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_titles_name_enUS"));
        titlesOps.ensureIndex(new Index().on("nameI18n.es-ES", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_titles_name_esES"));

        var newsOps = mongoTemplate.indexOps("news");

        newsOps.ensureIndex(new Index().on("titleI18n.pt-BR", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_news_title_ptBR"));
        newsOps.ensureIndex(new Index().on("titleI18n.en-US", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_news_title_enUS"));
        newsOps.ensureIndex(new Index().on("titleI18n.es-ES", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_news_title_esES"));
    }

    private void unsetField(String collection, String field) {
        mongoTemplate.getCollection(collection)
                .updateMany(new Document(), new Document("$unset", new Document(field, "")));
    }

    private void dropIndexIfExists(String collection, String indexName) {
        var ops = mongoTemplate.indexOps(collection);

        ops.getIndexInfo().stream()
                .filter(idx -> idx.getName().equals(indexName))
                .findFirst()
                .ifPresent(idx -> ops.dropIndex(indexName));
    }
}

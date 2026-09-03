package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.client.model.UpdateOptions;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Remove os campos texto legados {@code author}, {@code artist} e {@code publisher}
 * de todos os documentos de {@code titles}.
 *
 * <p>Motivo: autores/artistas/editoras passaram a ser modelados em tabelas
 * relacionais no PostgreSQL ({@code authors}/{@code publishers} + junções
 * {@code title_authors}/{@code title_publishers}), populadas pelo backfill
 * {@code AuthorPublisherBackfillRunner}. Os campos string viravam fonte
 * divergente. O {@code @TextIndexed} de {@code author} também foi removido da
 * entidade {@link com.mangareader.domain.manga.entity.Title}; nenhum outro campo
 * o usa, então não há text index a recriar ({@code auto-index-creation=false}; o
 * índice explícito já fora dropado em V007).
 *
 * <p>Idempotente — {@code $unset} em campos ausentes é no-op.
 *
 * <p>Nota de versionamento: segue a sequência real do projeto (após V018), por
 * isso {@code order = "019"} — e não o "002" sugerido no enunciado, que colidiria
 * com {@code V002CreateViewHistoryIndexes} e rodaria antes das demais migrations.
 */
@ChangeUnit(id = "V019-remove-title-legacy-author-fields", order = "019", author = "mangareader")
public class V019RemoveTitleLegacyAuthorFields {
    private final MongoTemplate mongoTemplate;

    public V019RemoveTitleLegacyAuthorFields(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var unset = new Document("$unset", new Document()
                .append("author", "")
                .append("artist", "")
                .append("publisher", ""));

        mongoTemplate.getCollection("titles")
                .updateMany(new Document(), unset, new UpdateOptions());
    }

    @RollbackExecution
    public void rollback() {
        // Não suportado — os valores originais não são recuperáveis sem o backfill
        // inverso (junções relacionais → string). Restaurar apenas as chaves vazias
        // seria enganoso; rollback é no-op intencional.
    }
}

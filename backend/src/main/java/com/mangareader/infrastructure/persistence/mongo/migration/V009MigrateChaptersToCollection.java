package com.mangareader.infrastructure.persistence.mongo.migration;

import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;

import com.mongodb.client.MongoCollection;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — DT-17: move capítulos embedded em
 * {@code titles.chapters[]} para a coleção própria {@code chapters}
 * (referenciada por {@code titleId}).
 *
 * <p>Idempotente: só processa documentos de {@code titles} que ainda têm o
 * campo {@code chapters}; ao final faz {@code $unset chapters}. Mongock não é
 * transacional no projeto — reexecução é segura (não há mais o campo após a
 * primeira passada).
 */
@ChangeUnit(id = "V009-migrate-chapters-to-collection", order = "009", author = "mangareader")
public class V009MigrateChaptersToCollection {
    private final MongoTemplate mongoTemplate;

    public V009MigrateChaptersToCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        MongoCollection<Document> titles = mongoTemplate.getCollection("titles");
        MongoCollection<Document> chapters = mongoTemplate.getCollection("chapters");

        List<Document> chapterDocs = new ArrayList<>();
        List<Object> migratedTitleIds = new ArrayList<>();

        for (Document title : titles.find(new Document("chapters",
                new Document("$exists", true)))) {
            Object titleId = title.get("_id");
            List<?> embedded = title.getList("chapters", Object.class);

            if (embedded != null) {
                for (Object raw : embedded) {
                    if (raw instanceof Document ch) {
                        Document doc = new Document(ch);
                        doc.remove("_id");
                        doc.put("titleId",
                                titleId != null ? titleId.toString() : null);
                        chapterDocs.add(doc);
                    }
                }
            }

            migratedTitleIds.add(titleId);
        }

        if (!chapterDocs.isEmpty()) {
            chapters.insertMany(chapterDocs);
        }

        mongoTemplate.indexOps("chapters").ensureIndex(
                new Index().on("titleId", Sort.Direction.ASC)
                        .named("idx_chapters_titleId"));

        var compound = new Document();
        compound.put("titleId", 1);
        compound.put("number", 1);
        mongoTemplate.indexOps("chapters").ensureIndex(
                new CompoundIndexDefinition(compound)
                        .unique()
                        .named("idx_chapter_title_number"));

        if (!migratedTitleIds.isEmpty()) {
            titles.updateMany(
                    new Document("_id", new Document("$in", migratedTitleIds)),
                    new Document("$unset", new Document("chapters", "")));
        }
    }

    @RollbackExecution
    public void rollback() {
        try {
            mongoTemplate.dropCollection("chapters");
        } catch (DataAccessException ignored) {
            // Idempotente — coleção já removida ou inexistente.
        }
    }
}

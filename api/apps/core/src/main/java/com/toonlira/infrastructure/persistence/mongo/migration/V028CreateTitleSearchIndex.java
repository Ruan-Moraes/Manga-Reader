package com.toonlira.infrastructure.persistence.mongo.migration;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import com.toonlira.application.manga.service.TitleSearchText;
import com.toonlira.domain.manga.valueobject.TitleAlias;
import com.toonlira.shared.domain.i18n.LocalizedString;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V028-create-title-search-index", order = "028", author = "toonlira")
public class V028CreateTitleSearchIndex {
    static final String INDEX_NAME = "idx_titles_search_grams";
    private static final int BATCH_SIZE = 500;

    private final MongoTemplate mongoTemplate;

    public V028CreateTitleSearchIndex(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var pending = new ArrayList<Document>(BATCH_SIZE);
        mongoTemplate.getCollection("titles")
                .find()
                .projection(new Document("_id", 1).append("name", 1).append("aliases", 1))
                .forEach(document -> {
                    pending.add(document);
                    if (pending.size() == BATCH_SIZE) flush(pending);
                });
        flush(pending);

        mongoTemplate.indexOps("titles").ensureIndex(
                new Index().on("searchIndex.grams", Sort.Direction.ASC).named(INDEX_NAME));
    }

    @RollbackExecution
    public void rollback() {
        var operations = mongoTemplate.indexOps("titles");
        if (operations.getIndexInfo().stream().anyMatch(index -> INDEX_NAME.equals(index.getName()))) {
            operations.dropIndex(INDEX_NAME);
        }
        mongoTemplate.getCollection("titles")
                .updateMany(new Document(), new Document("$unset", new Document("searchIndex", "")));
    }

    private void flush(List<Document> pending) {
        if (pending.isEmpty()) return;

        var bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "titles");
        for (var document : pending) {
            var nameDocument = document.get("name", Document.class);
            Map<String, String> names = localizedNames(nameDocument);
            var index = TitleSearchText.buildIndex(
                    LocalizedString.of(names), aliases(document.get("aliases")));
            var stored = new Document("normalizedNames", new Document(index.getNormalizedNames()))
                    .append("normalizedAliases", index.getNormalizedAliases())
                    .append("grams", index.getGrams());
            bulk.updateOne(
                    Query.query(Criteria.where("_id").is(document.get("_id"))),
                    new Update().set("searchIndex", stored));
        }
        bulk.execute();
        pending.clear();
    }

    private static Map<String, String> localizedNames(Document nameDocument) {
        if (nameDocument == null) return Map.of();

        Object values = nameDocument.getOrDefault("values", nameDocument);
        if (!(values instanceof Map<?, ?> map)) return Map.of();

        return map.entrySet().stream()
                .filter(entry -> entry.getValue() != null)
                .collect(java.util.stream.Collectors.toMap(
                        entry -> String.valueOf(entry.getKey()),
                        entry -> String.valueOf(entry.getValue())));
    }

    private static List<TitleAlias> aliases(Object value) {
        if (!(value instanceof List<?> values)) return List.of();

        return values.stream()
                .map(V028CreateTitleSearchIndex::aliasName)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> TitleAlias.builder().name(name).build())
                .toList();
    }

    private static String aliasName(Object value) {
        if (value instanceof Document document) return document.getString("name");
        if (value instanceof Map<?, ?> map) {
            Object name = map.get("name");
            return name == null ? null : name.toString();
        }
        return null;
    }
}

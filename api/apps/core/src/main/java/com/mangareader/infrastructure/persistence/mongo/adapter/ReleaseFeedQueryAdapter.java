package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.util.regex.Pattern;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.ReleaseFeedQueryPort;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ReleaseFeedQueryAdapter implements ReleaseFeedQueryPort {
    private final MongoTemplate mongo;

    @Override
    public Page<Item> find(Query query, Pageable pageable) {
        List<Document> common = commonPipeline(query.from(), query.to(), query.language(),
                query.restrictTitleIds(), query.excludeAdult(), query.titleQuery());
        List<Document> contentPipeline = new ArrayList<>(common);
        contentPipeline.add(new Document("$sort", new Document("publishedAt", -1).append("_id", -1)));
        contentPipeline.add(new Document("$skip", pageable.getOffset()));
        contentPipeline.add(new Document("$limit", pageable.getPageSize()));

        List<Item> content = mongo.getCollection("chapters").aggregate(contentPipeline).into(new ArrayList<>())
                .stream().map(this::mapItem).toList();

        List<Document> countPipeline = new ArrayList<>(common);
        countPipeline.add(new Document("$count", "total"));
        Document count = mongo.getCollection("chapters").aggregate(countPipeline).first();
        long total = count == null ? 0 : ((Number) count.get("total")).longValue();

        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public List<String> findAvailableLanguages(Instant from, Instant to, boolean excludeAdult) {
        List<Document> pipeline = commonPipeline(from, to, null, null, excludeAdult, null);
        pipeline.add(new Document("$match", new Document("contentLanguage",
                new Document("$type", "string").append("$ne", ""))));
        pipeline.add(new Document("$group", new Document("_id", "$contentLanguage")));
        pipeline.add(new Document("$sort", new Document("_id", 1)));
        return mongo.getCollection("chapters").aggregate(pipeline).into(new ArrayList<>()).stream()
                .map(document -> document.getString("_id"))
                .filter(value -> value != null && !value.isBlank())
                .toList();
    }

    @Override
    public List<String> findPublicChapterIds(Instant from, Instant to, boolean excludeAdult) {
        List<Document> pipeline = commonPipeline(from, to, null, null, excludeAdult, null);
        pipeline.add(new Document("$project", new Document("_id", new Document("$toString", "$_id"))));
        return mongo.getCollection("chapters").aggregate(pipeline).into(new ArrayList<>()).stream()
                .map(document -> document.getString("_id"))
                .toList();
    }

    @Override
    public boolean isPublicChapter(String chapterId, Instant now, boolean excludeAdult) {
        List<Document> pipeline = commonPipeline(Instant.EPOCH, now, null, null, excludeAdult, null);
        pipeline.add(0, new Document("$match", new Document("_id", mongoId(chapterId))));
        pipeline.add(new Document("$limit", 1));
        return mongo.getCollection("chapters").aggregate(pipeline).first() != null;
    }

    private static List<Document> commonPipeline(Instant from, Instant to, String language,
            Collection<String> restrictTitleIds, boolean excludeAdult, String titleQuery) {
        Document chapterMatch = new Document("status", "PUBLISHED")
                .append("deletedAt", null)
                .append("publishedAt", new Document("$gte", from).append("$lte", to));
        if (language != null && !language.isBlank()) chapterMatch.append("contentLanguage", language);
        if (restrictTitleIds != null) chapterMatch.append("titleId", new Document("$in", restrictTitleIds));

        List<Document> pipeline = new ArrayList<>();
        pipeline.add(new Document("$match", chapterMatch));
        pipeline.add(new Document("$set", new Document("__titleObjectId",
                new Document("$convert", new Document("input", "$titleId")
                        .append("to", "objectId")
                        .append("onError", "$titleId")
                        .append("onNull", null)))));
        pipeline.add(new Document("$lookup", new Document("from", "titles")
                .append("localField", "__titleObjectId")
                .append("foreignField", "_id")
                .append("as", "titleDocument")));
        pipeline.add(new Document("$unset", "__titleObjectId"));
        pipeline.add(new Document("$unwind", "$titleDocument"));

        Document titleMatch = new Document();
        if (excludeAdult) titleMatch.append("titleDocument.adult", new Document("$ne", true));
        if (titleQuery != null && !titleQuery.isBlank()) {
            Pattern pattern = Pattern.compile(Pattern.quote(titleQuery.trim()), Pattern.CASE_INSENSITIVE);
            titleMatch.append("$or", List.of(
                    new Document("titleDocument.name.pt-BR", pattern),
                    new Document("titleDocument.name.en-US", pattern),
                    new Document("titleDocument.name.es-ES", pattern)));
        }
        if (!titleMatch.isEmpty()) pipeline.add(new Document("$match", titleMatch));
        return pipeline;
    }

    private static Object mongoId(String value) {
        return ObjectId.isValid(value) ? new ObjectId(value) : value;
    }

    @SuppressWarnings("unchecked")
    private Item mapItem(Document source) {
        Document title = source.get("titleDocument", Document.class);
        Object id = source.get("_id");
        return new Item(
                id == null ? "" : id.toString(),
                source.getString("titleId"),
                localizedMap(title.get("name")),
                title.getString("cover"),
                source.getString("number"),
                localizedMap(source.get("title")),
                instant(source.get("publishedAt")),
                source.getString("contentLanguage"),
                source.getString("scanGroupId"),
                localizedMap(source.get("scanGroupName")),
                source.getString("scanGroupLogo"));
    }

    private static Instant instant(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof Date date) return date.toInstant();
        return value == null ? null : Instant.parse(value.toString());
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> localizedMap(Object value) {
        if (value instanceof Document document) {
            Object nested = document.get("values");
            if (nested instanceof Map<?, ?> map) {
                return map.entrySet().stream().collect(java.util.stream.Collectors.toMap(
                        entry -> String.valueOf(entry.getKey()),
                        entry -> String.valueOf(entry.getValue())));
            }
            return document.entrySet().stream()
                    .filter(entry -> entry.getValue() instanceof String)
                    .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, entry -> (String) entry.getValue()));
        }
        if (value instanceof Map<?, ?> map) {
            return map.entrySet().stream().collect(java.util.stream.Collectors.toMap(
                    entry -> String.valueOf(entry.getKey()),
                    entry -> String.valueOf(entry.getValue())));
        }
        return Map.of();
    }
}

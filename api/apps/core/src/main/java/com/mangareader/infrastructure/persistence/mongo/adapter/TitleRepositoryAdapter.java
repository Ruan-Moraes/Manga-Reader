package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bson.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.port.TitleReferenceMatch;
import com.mangareader.application.manga.port.TitleSearchHit;
import com.mangareader.application.manga.service.TitleSearchText;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.TitleAlias;
import com.mangareader.domain.manga.valueobject.TitleSearchMatchType;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link TitleRepositoryPort} ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class TitleRepositoryAdapter implements TitleRepositoryPort {
    private final TitleMongoRepository mongoRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public List<Title> findAll() {
        return mongoRepository.findAll();
    }

    @Override
    public Optional<Title> findById(String id) {
        return mongoRepository.findById(id);
    }

    @Override
    public List<Title> findByIds(java.util.Collection<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return mongoRepository.findAllById(ids);
    }

    @Override
    public List<String> findVisibleIds(
            java.util.Collection<String> ids, boolean excludeAdult) {
        if (ids == null || ids.isEmpty()) return List.of();

        var query = new Query(Criteria.where("_id").in(ids));
        if (excludeAdult) query.addCriteria(Criteria.where("adult").ne(true));
        query.fields().include("_id");
        return mongoTemplate.find(query, Title.class).stream()
                .map(Title::getId)
                .toList();
    }

    @Override
    public Page<Title> findVisibleByIds(
            java.util.Collection<String> ids, boolean excludeAdult, Pageable pageable) {
        if (ids == null || ids.isEmpty()) return new PageImpl<>(List.of(), pageable, 0);

        var query = new Query(Criteria.where("_id").in(ids));
        if (excludeAdult) query.addCriteria(Criteria.where("adult").ne(true));
        return findPage(query, pageable);
    }

    @Override
    public List<Title> searchByName(String query) {
        if (query == null || query.isBlank()) return List.of();
        return mongoTemplate.find(buildNameSearchQuery(query), Title.class);
    }

    private static Query buildNameSearchQuery(String query) {
        var regex = java.util.regex.Pattern.quote(query);
        var crit = new Criteria().orOperator(
                Criteria.where("name.pt-BR").regex(regex, "i"),
                Criteria.where("name.en-US").regex(regex, "i"),
                Criteria.where("name.es-ES").regex(regex, "i")
        );
        return new Query(crit);
    }

    @Override
    public List<Title> findByGenresContainingAll(List<String> genres) {
        return mongoRepository.findByGenresContainingAll(genres);
    }

    @Override
    public List<Title> findByFilters(List<String> genres, String status, Boolean adult) {
        return findByFilters(genres, status, adult, null);
    }

    @Override
    public List<Title> findByFilters(List<String> genres, String status, Boolean adult,
                                     java.util.Collection<String> restrictIds) {
        List<Criteria> conditions = new ArrayList<>();

        if (genres != null && !genres.isEmpty()) {
            conditions.add(Criteria.where("genres").all(genres));
        }

        if (status != null && !"ALL".equalsIgnoreCase(status)) {
            conditions.add(Criteria.where("status").is(status.toUpperCase()));
        }

        if (adult != null) {
            conditions.add(Criteria.where("adult").is(adult));
        }

        if (restrictIds != null) {
            conditions.add(Criteria.where("_id").in(restrictIds));
        }

        Query query = new Query();

        if (!conditions.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(conditions.toArray(new Criteria[0])));
        }

        return mongoTemplate.find(query, Title.class);
    }

    @Override
    public Title save(Title title) {
        return mongoRepository.save(title);
    }

    @Override
    public void deleteById(String id) {
        mongoRepository.deleteById(id);
    }

    @Override
    public Page<Title> findAll(Pageable pageable) {
        return mongoRepository.findAll(pageable);
    }

    @Override
    public Page<Title> findAllExcludingAdult(Pageable pageable) {
        return findPage(new Query(Criteria.where("adult").ne(true)), pageable);
    }

    @Override
    public Page<Title> findByGenresContaining(String genre, Pageable pageable) {
        return mongoRepository.findByGenresContaining(genre, pageable);
    }

    @Override
    public Page<Title> findByGenreExcludingAdult(String genre, Pageable pageable) {
        return findPage(new Query(new Criteria().andOperator(
                Criteria.where("genres").is(genre), Criteria.where("adult").ne(true))), pageable);
    }

    @Override
    public Page<Title> searchByName(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        }
        Query q = buildNameSearchQuery(query);
        long total = mongoTemplate.count(q, Title.class);
        var results = mongoTemplate.find(q.with(pageable), Title.class);
        return new org.springframework.data.domain.PageImpl<>(results, pageable, total);
    }

    @Override
    public Page<Title> searchByNameExcludingAdult(String query, Pageable pageable) {
        if (query == null || query.isBlank()) return findAllExcludingAdult(pageable);
        Query q = buildNameSearchQuery(query);
        q.addCriteria(Criteria.where("adult").ne(true));
        return findPage(q, pageable);
    }

    @Override
    public Page<TitleSearchHit> searchGlobal(
            String normalizedQuery,
            List<String> contentLanguageTags,
            Map<String, TitleReferenceMatch> relationalMatches,
            boolean excludeAdult,
            Pageable pageable) {
        var grams = TitleSearchText.grams(normalizedQuery);
        if (grams.isEmpty() && relationalMatches.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        var relationalIds = List.copyOf(relationalMatches.keySet());
        var alternatives = new ArrayList<Document>();
        if (!grams.isEmpty()) {
            alternatives.add(new Document("searchIndex.grams", new Document("$all", grams)));
        }
        if (!relationalIds.isEmpty()) {
            alternatives.add(new Document("$expr", new Document("$in", List.of(
                    new Document("$toString", "$_id"),
                    relationalIds))));
        }

        Document match = alternatives.size() == 1
                ? alternatives.getFirst()
                : new Document("$or", alternatives);
        if (excludeAdult) {
            match = new Document("$and", List.of(
                    match,
                    new Document("adult", new Document("$ne", true))));
        }

        var primaryTag = contentLanguageTags == null || contentLanguageTags.isEmpty()
                ? "pt-BR"
                : contentLanguageTags.getFirst();
        var primaryName = new Document("$ifNull", List.of(
                "$searchIndex.normalizedNames." + primaryTag,
                new Document("$ifNull", List.of("$searchIndex.normalizedNames.pt-BR", ""))));
        var allNames = new Document("$objectToArray",
                new Document("$ifNull", List.of("$searchIndex.normalizedNames", new Document())));
        var allAliases = new Document("$ifNull", List.of("$searchIndex.normalizedAliases", List.of()));

        var rank = new Document("$switch", new Document("branches", List.of(
                branch(new Document("$eq", List.of(primaryName, normalizedQuery)), 0),
                branch(regexMatch(primaryName, "^" + normalizedQuery), 1),
                branch(regexMatch(primaryName, normalizedQuery), 2),
                branch(anyNameMatches(allNames, primaryName, normalizedQuery), 3),
                branch(anyValueMatches(allAliases, normalizedQuery), 3),
                branch(idsCondition(relationalMatches, TitleSearchMatchType.AUTHOR), 4),
                branch(idsCondition(relationalMatches, TitleSearchMatchType.ARTIST), 4),
                branch(idsCondition(relationalMatches, TitleSearchMatchType.PUBLISHER), 4),
                branch(idsCondition(relationalMatches, TitleSearchMatchType.GROUP), 4)
        )).append("default", 99));

        var pipeline = List.of(
                new Document("$match", match),
                new Document("$addFields", new Document("_searchRank", rank)
                        .append("_searchPopularity", new Document("$convert", new Document("input", "$popularity")
                                .append("to", "double")
                                .append("onError", 0)
                                .append("onNull", 0)))),
                new Document("$match", new Document("_searchRank", new Document("$lt", 99))),
                new Document("$sort", new Document("_searchRank", 1)
                        .append("_searchPopularity", -1)
                        .append("name.pt-BR", 1)),
                new Document("$facet", new Document("content", List.of(
                        new Document("$skip", pageable.getOffset()),
                        new Document("$limit", pageable.getPageSize())))
                        .append("total", List.of(new Document("$count", "value"))))
        );

        var facet = mongoTemplate.getCollection("titles").aggregate(pipeline).first();
        if (facet == null) return new PageImpl<>(List.of(), pageable, 0);

        @SuppressWarnings("unchecked")
        var documents = (List<Document>) facet.getOrDefault("content", List.of());
        @SuppressWarnings("unchecked")
        var totalDocuments = (List<Document>) facet.getOrDefault("total", List.of());
        long total = totalDocuments.isEmpty()
                ? 0
                : ((Number) totalDocuments.getFirst().get("value")).longValue();

        var hits = documents.stream()
                .map(document -> toSearchHit(document, contentLanguageTags, normalizedQuery, relationalMatches))
                .toList();
        return new PageImpl<>(hits, pageable, total);
    }

    private TitleSearchHit toSearchHit(
            Document document,
            List<String> contentLanguageTags,
            String normalizedQuery,
            Map<String, TitleReferenceMatch> relationalMatches) {
        var rank = ((Number) document.getOrDefault("_searchRank", 99)).intValue();
        var title = mongoTemplate.getConverter().read(Title.class, document);

        if (rank <= 2) {
            return new TitleSearchHit(title, TitleSearchMatchType.TITLE,
                    resolvePrimaryName(title, contentLanguageTags));
        }
        if (rank == 3) {
            return new TitleSearchHit(title, TitleSearchMatchType.ALTERNATE_TITLE,
                    resolveAlternateNameOrAlias(title, contentLanguageTags, normalizedQuery));
        }

        var relational = relationalMatches.get(title.getId());
        return relational == null
                ? new TitleSearchHit(title, TitleSearchMatchType.TITLE, resolvePrimaryName(title, contentLanguageTags))
                : new TitleSearchHit(title, relational.type(), relational.matchedText());
    }

    private static String resolvePrimaryName(Title title, List<String> tags) {
        if (title.getName() == null) return "";
        if (tags != null) {
            for (var tag : tags) {
                var value = title.getName().values().get(tag);
                if (value != null && !value.isBlank()) return value;
            }
        }
        return title.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"));
    }

    private static String resolveAlternateNameOrAlias(Title title, List<String> tags, String query) {
        var primary = resolvePrimaryName(title, tags);
        if (title.getName() != null) {
            var translated = title.getName().values().values().stream()
                    .filter(value -> value != null && !value.equals(primary))
                    .filter(value -> TitleSearchText.normalize(value).contains(query))
                    .findFirst();
            if (translated.isPresent()) return translated.get();
        }

        return title.getAliases().stream()
                .filter(alias -> alias != null && alias.getName() != null)
                .map(TitleAlias::getName)
                .filter(value -> TitleSearchText.normalize(value).contains(query))
                .findFirst()
                .orElse(primary);
    }

    private static Document branch(Object condition, int rank) {
        return new Document("case", condition).append("then", rank);
    }

    private static Document regexMatch(Object input, String regex) {
        return new Document("$regexMatch", new Document("input",
                new Document("$ifNull", List.of(input, ""))).append("regex", regex));
    }

    private static Document anyNameMatches(Object allNames, Object primaryName, String query) {
        var mapped = new Document("$map", new Document("input", allNames)
                .append("as", "entry")
                .append("in", new Document("$and", List.of(
                        new Document("$ne", List.of("$$entry.v", primaryName)),
                        regexMatch("$$entry.v", query)))));
        return new Document("$anyElementTrue", mapped);
    }

    private static Document anyValueMatches(Object values, String query) {
        var mapped = new Document("$map", new Document("input", values)
                .append("as", "value")
                .append("in", regexMatch("$$value", query)));
        return new Document("$anyElementTrue", mapped);
    }

    private static Document idsCondition(
            Map<String, TitleReferenceMatch> matches,
            TitleSearchMatchType type) {
        var ids = matches.values().stream()
                .filter(match -> match.type() == type)
                .map(TitleReferenceMatch::titleId)
                .distinct()
                .toList();
        return new Document("$in", List.of(new Document("$toString", "$_id"), ids));
    }

    private Page<Title> findPage(Query query, Pageable pageable) {
        long total = mongoTemplate.count(query, Title.class);
        var results = mongoTemplate.find(query.with(pageable), Title.class);
        return new org.springframework.data.domain.PageImpl<>(results, pageable, total);
    }

    @Override
    public Page<Title> findByGenresContainingAll(List<String> genres, Pageable pageable) {
        return mongoRepository.findByGenresContainingAll(genres, pageable);
    }

    @Override
    public long count() {
        return mongoRepository.count();
    }

    @Override
    public long countByStatus(String status) {
        Query query = new Query(Criteria.where("status").is(status));

        return mongoTemplate.count(query, Title.class);
    }

}

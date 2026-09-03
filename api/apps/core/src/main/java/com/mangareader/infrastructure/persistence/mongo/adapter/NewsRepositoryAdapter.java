package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.stereotype.Component;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.infrastructure.persistence.mongo.document.NewsDocument;
import com.mangareader.infrastructure.persistence.mongo.mapper.NewsPersistenceMapper;
import com.mangareader.infrastructure.persistence.mongo.repository.NewsMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link NewsRepositoryPort} usando Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class NewsRepositoryAdapter implements NewsRepositoryPort {
    private final NewsMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<NewsItem> findById(String id) {
        return repository.findById(id).map(NewsPersistenceMapper::toDomain);
    }

    @Override
    public Optional<NewsItem> findByIdOrSlug(String idOrSlug) {
        Query query = new Query(new Criteria().orOperator(
                Criteria.where("_id").is(idOrSlug), Criteria.where("slug").is(idOrSlug)));
        return Optional.ofNullable(mongoTemplate.findOne(query, NewsDocument.class))
                .map(NewsPersistenceMapper::toDomain);
    }

    @Override
    public List<NewsItem> searchByTitle(String query) {
        if (query == null || query.isBlank()) return List.of();
        return mongoTemplate.find(buildTitleSearchQuery(query), NewsDocument.class).stream()
                .map(NewsPersistenceMapper::toDomain).toList();
    }

    @Override
    public NewsItem save(NewsItem newsItem) {
        return NewsPersistenceMapper.toDomain(repository.save(NewsPersistenceMapper.toDocument(newsItem)));
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public Page<NewsItem> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(NewsPersistenceMapper::toDomain);
    }

    @Override
    public Page<NewsItem> findByCategory(NewsCategory category, Pageable pageable) {
        Query query = new Query(Criteria.where("status").is(NewsStatus.PUBLISHED)
                .and("publishedAt").lte(Instant.now()).and("category").is(category));
        return page(query, pageable);
    }

    @Override
    public Page<NewsItem> searchByTitle(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }
        Query q = buildTitleSearchQuery(query);
        q.addCriteria(Criteria.where("status").is(NewsStatus.PUBLISHED)
                .and("publishedAt").lte(Instant.now()));
        long total = mongoTemplate.count(q, NewsDocument.class);
        var results = mongoTemplate.find(q.with(pageable), NewsDocument.class).stream()
                .map(NewsPersistenceMapper::toDomain).toList();
        return new PageImpl<>(results, pageable, total);
    }

    @Override
    public Page<NewsItem> findPublished(String query, NewsCategory category, Instant publishedAfter, Instant now,
                                        Pageable pageable) {
        Criteria publicationDate = Criteria.where("publishedAt").lte(now);
        if (publishedAfter != null) publicationDate = publicationDate.gte(publishedAfter);
        var predicates = new java.util.ArrayList<Criteria>();
        predicates.add(Criteria.where("status").is(NewsStatus.PUBLISHED));
        predicates.add(publicationDate);
        if (category != null) predicates.add(Criteria.where("category").is(category));
        Criteria criteria = new Criteria().andOperator(predicates);
        Query mongoQuery = new Query(criteria);
        addTextCriteria(mongoQuery, query);
        return page(mongoQuery, pageable);
    }

    @Override
    public Page<NewsItem> findAdmin(String query, NewsStatus status, NewsCategory category,
                                    Pageable pageable) {
        Criteria criteria = new Criteria();
        if (status != null) criteria = Criteria.where("status").is(status);
        if (category != null) criteria = criteria.and("category").is(category);
        Query mongoQuery = new Query(criteria);
        addTextCriteria(mongoQuery, query);
        return page(mongoQuery, pageable);
    }

    @Override
    public List<NewsItem> findRelated(NewsItem source, int limit) {
        Criteria related = Criteria.where("status").is(NewsStatus.PUBLISHED)
                .and("_id").ne(source.getId())
                .and("publishedAt").lte(Instant.now())
                .orOperator(Criteria.where("category").is(source.getCategory()),
                        Criteria.where("tags").in(source.getTags()));
        Query query = new Query(related)
                .with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,
                        "trendingScore", "publishedAt"))
                .limit(limit);
        return mongoTemplate.find(query, NewsDocument.class).stream()
                .map(NewsPersistenceMapper::toDomain).toList();
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, String id) {
        Criteria criteria = Criteria.where("slug").is(slug);
        if (id != null) criteria = criteria.and("_id").ne(id);
        return mongoTemplate.exists(new Query(criteria), NewsDocument.class);
    }

    @Override
    public List<NewsItem> findScheduledBefore(Instant instant) {
        Query query = new Query(Criteria.where("status").is(NewsStatus.SCHEDULED)
                .and("scheduledAt").lte(instant));
        return mongoTemplate.find(query, NewsDocument.class).stream()
                .map(NewsPersistenceMapper::toDomain).toList();
    }

    @Override
    public List<NewsItem> saveAll(List<NewsItem> items) {
        return repository.saveAll(items.stream().map(NewsPersistenceMapper::toDocument).toList()).stream()
                .map(NewsPersistenceMapper::toDomain).toList();
    }

    @Override
    public long count() {
        return repository.count();
    }

    private static Query buildTitleSearchQuery(String query) {
        var regex = java.util.regex.Pattern.quote(query);
        var crit = new Criteria().orOperator(
                Criteria.where("title.pt-BR").regex(regex, "i"),
                Criteria.where("title.en-US").regex(regex, "i"),
                Criteria.where("title.es-ES").regex(regex, "i")
        );
        return new Query(crit);
    }

    private Page<NewsItem> page(Query query, Pageable pageable) {
        long total = mongoTemplate.count(query, NewsDocument.class);
        var content = mongoTemplate.find(query.with(pageable), NewsDocument.class).stream()
                .map(NewsPersistenceMapper::toDomain).toList();
        return new PageImpl<>(content, pageable, total);
    }

    private static void addTextCriteria(Query query, String text) {
        if (text == null || text.isBlank()) return;
        query.addCriteria(TextCriteria.forDefaultLanguage().matching(text.trim()));
    }
}

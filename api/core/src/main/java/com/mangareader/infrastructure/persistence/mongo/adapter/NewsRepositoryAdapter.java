package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
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
        return repository.findById(id);
    }

    @Override
    public List<NewsItem> searchByTitle(String query) {
        if (query == null || query.isBlank()) return List.of();
        return mongoTemplate.find(buildTitleSearchQuery(query), NewsItem.class);
    }

    @Override
    public NewsItem save(NewsItem newsItem) {
        return repository.save(newsItem);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public Page<NewsItem> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<NewsItem> findByCategory(NewsCategory category, Pageable pageable) {
        return repository.findByCategory(category, pageable);
    }

    @Override
    public Page<NewsItem> searchByTitle(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }
        Query q = buildTitleSearchQuery(query);
        long total = mongoTemplate.count(q, NewsItem.class);
        var results = mongoTemplate.find(q.with(pageable), NewsItem.class);
        return new PageImpl<>(results, pageable, total);
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
}

package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
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
    public Page<Title> findByGenresContaining(String genre, Pageable pageable) {
        return mongoRepository.findByGenresContaining(genre, pageable);
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

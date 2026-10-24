package com.toonlira.infrastructure.persistence.mongo.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.toonlira.infrastructure.persistence.mongo.document.TitleRatingAggregateDocument;

/**
 * Repositório read-only da coleção {@code title_rating_aggregate}.
 */
public interface TitleRatingAggregateMongoRepository
        extends MongoRepository<TitleRatingAggregateDocument, String> {
}

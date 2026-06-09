package com.mangareader.aggregator.infrastructure.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.aggregator.domain.TitleRatingAggregate;

/**
 * Repositório da coleção {@code title_rating_aggregate} (escrita pelo aggregator).
 */
public interface TitleRatingAggregateRepository extends MongoRepository<TitleRatingAggregate, String> {
}

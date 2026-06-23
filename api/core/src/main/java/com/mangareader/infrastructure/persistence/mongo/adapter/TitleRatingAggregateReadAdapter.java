package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.infrastructure.persistence.mongo.document.TitleRatingAggregateDocument;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleRatingAggregateMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter read-only do agregado de avaliação ({@code title_rating_aggregate}).
 */
@Component
@RequiredArgsConstructor
public class TitleRatingAggregateReadAdapter implements TitleRatingAggregateReadPort {
    private final TitleRatingAggregateMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<TitleRatingAggregateView> findByTitleId(String titleId) {
        return repository.findById(titleId).map(TitleRatingAggregateReadAdapter::toView);
    }

    @Override
    public Map<String, TitleRatingAggregateView> findByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return Map.of();
        }

        return StreamSupport.stream(repository.findAllById(titleIds).spliterator(), false)
                .map(TitleRatingAggregateReadAdapter::toView)
                .collect(Collectors.toMap(TitleRatingAggregateView::titleId, Function.identity()));
    }

    @Override
    public List<TitleRatingAggregateView> findTop(int limit) {
        if (limit <= 0) {
            return List.of();
        }

        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "ratingAverage", "totalRatings"))
                .limit(limit);

        return mongoTemplate.find(query, TitleRatingAggregateDocument.class).stream()
                .map(TitleRatingAggregateReadAdapter::toView)
                .toList();
    }

    private static TitleRatingAggregateView toView(TitleRatingAggregateDocument d) {
        return new TitleRatingAggregateView(
                d.getTitleId(),
                d.getRatingAverage(),
                d.getTotalRatings(),
                d.getStar1(), d.getStar2(), d.getStar3(), d.getStar4(), d.getStar5());
    }
}

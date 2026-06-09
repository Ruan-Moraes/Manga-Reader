package com.mangareader.infrastructure.persistence.mongo.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;

/**
 * Projeção read-only da coleção {@code title_rating_aggregate}.
 * <p>
 * A coleção é escrita exclusivamente pelo serviço {@code rating-aggregator}
 * (schema owner). Aqui mapeamos apenas os campos lidos. {@code titleId} é o
 * {@code _id}.
 */
@Document(collection = "title_rating_aggregate")
@Getter
public class TitleRatingAggregateDocument {
    @Id
    private String titleId;

    private double ratingAverage;
    private long totalRatings;

    private long star1;
    private long star2;
    private long star3;
    private long star4;
    private long star5;
}

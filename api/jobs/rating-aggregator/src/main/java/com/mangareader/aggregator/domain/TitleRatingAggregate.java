package com.mangareader.aggregator.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Agregado consolidado de avaliação de uma obra (= {@code obra_avaliacao}).
 * <p>
 * Fonte oficial de nota/contagem exibida em todas as telas. Recalculado por
 * evento ({@code rating.*}) e pelo job de reconciliação; nunca por agregação
 * ao vivo durante a renderização.
 * <p>
 * {@code titleId} é o {@code _id} da coleção (1 documento por título).
 */
@Document(collection = "reviews_aggregate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TitleRatingAggregate {
    @Id
    private String titleId;

    private double ratingAverage;

    private long totalRatings;

    private long star1;
    private long star2;
    private long star3;
    private long star4;
    private long star5;

    private LocalDateTime updatedAt;

    public static TitleRatingAggregate empty(String titleId, LocalDateTime now) {
        return TitleRatingAggregate.builder()
                .titleId(titleId)
                .ratingAverage(0.0)
                .totalRatings(0)
                .updatedAt(now)
                .build();
    }
}

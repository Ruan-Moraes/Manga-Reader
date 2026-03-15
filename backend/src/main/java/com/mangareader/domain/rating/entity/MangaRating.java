package com.mangareader.domain.rating.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Avaliação de um mangá por um usuário (MongoDB).
 * <p>
 * Cada review possui notas por categoria (funRating, artRating, etc.)
 * e um overallRating calculado como a média das 6 categorias.
 */
@Document(collection = "ratings")
@CompoundIndex(name = "idx_rating_title_user", def = "{'titleId': 1, 'userId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MangaRating {
    @Id
    private String id;

    @Indexed
    private String titleId;

    @Indexed
    private String userId;

    private String userName;

    private String titleName;

    private double funRating;
    private double artRating;
    private double storylineRating;
    private double charactersRating;
    private double originalityRating;
    private double pacingRating;

    private double overallRating;

    private String comment;

    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Calcula o overallRating como a média das 6 categorias,
     * arredondado para 1 casa decimal.
     */
    public double calculateOverallRating() {
        double sum = funRating + artRating + storylineRating
                + charactersRating + originalityRating + pacingRating;
        return Math.round(sum / 6.0 * 10.0) / 10.0;
    }
}

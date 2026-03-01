package com.mangareader.domain.rating.entity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

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
 * Compatível com o frontend ({@code MangaRating} em rating.types.ts):
 * <pre>{ id, titleId, userName, stars, comment?, categoryRatings?, createdAt }</pre>
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

    private double stars;

    private String comment;

    /** Ex.: { "fun": 4.5, "art": 5.0, "storyline": 4.0, ... } */
    @Builder.Default
    private Map<String, Double> categoryRatings = new HashMap<>();

    @CreatedDate
    private LocalDateTime createdAt;
}

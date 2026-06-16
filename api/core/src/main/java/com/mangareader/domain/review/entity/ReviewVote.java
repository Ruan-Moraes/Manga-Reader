package com.mangareader.domain.review.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.shared.domain.vote.VoteValue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Voto de um usuário em uma resenha ({@link Review}) — MongoDB.
 * <p>
 * Um único voto por usuário por resenha (índice composto único
 * {@code ratingId + userId}). O valor pode ser {@link VoteValue#UP} ("Útil")
 * ou {@link VoteValue#DOWN} ("Contrário"). DT-45.
 */
@Document(collection = "reviews_votes")
@CompoundIndex(name = "idx_reviews_votes_review_user", def = "{'ratingId': 1, 'userId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewVote {
    @Id
    private String id;

    private String ratingId;

    private String userId;

    private VoteValue value;

    @CreatedDate
    private LocalDateTime createdAt;
}

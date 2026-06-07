package com.mangareader.presentation.rating.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de avaliação retornado ao frontend.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RatingResponse(
        String id,
        String titleId,
        String titleName,
        String userName,
        double overallRating,
        double funRating,
        double artRating,
        double storylineRating,
        double charactersRating,
        double originalityRating,
        double pacingRating,
        String comment,
        String reviewTitle,
        boolean spoiler,
        boolean top,
        long upvotes,
        long downvotes,
        String myVote,
        String createdAt
) {}

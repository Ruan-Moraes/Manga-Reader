package com.mangareader.presentation.review.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de avaliação retornado ao frontend.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReviewResponse(
        String id,
        String titleId,
        String titleName,
        String userId,
        String userName,
        double overallRating,
        double funRating,
        double artRating,
        double storylineRating,
        double charactersRating,
        double originalityRating,
        double pacingRating,
        String textContent,
        String reviewTitle,
        boolean spoiler,
        boolean top,
        long upvotes,
        long downvotes,
        String myVote,
        boolean edited,
        String createdAt,
        String updatedAt
) {}

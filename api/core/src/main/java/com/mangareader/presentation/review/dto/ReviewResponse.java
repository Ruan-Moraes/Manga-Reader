package com.mangareader.presentation.review.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de avaliação retornado ao frontend.
 * <p>
 * Os campos {@code cover}, {@code genres} e {@code chaptersRead} são opcionais e
 * só vêm preenchidos no endpoint "minhas avaliações" ({@code GET /reviews/user}),
 * que enriquece cada resenha com dados da obra e o progresso de leitura do
 * usuário. Nas demais listagens ficam {@code null} (omitidos pelo NON_NULL).
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
        String updatedAt,
        String cover,
        List<String> genres,
        Long chaptersRead
) {}

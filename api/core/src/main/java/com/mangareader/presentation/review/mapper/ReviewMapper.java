package com.mangareader.presentation.review.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.review.entity.Review;
import com.mangareader.presentation.review.dto.ReviewResponse;
import com.mangareader.shared.domain.vote.VoteValue;

/**
 * Mapper para converter entidade Review em DTO de resposta.
 */
public final class ReviewMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private ReviewMapper() {}

    public static ReviewResponse toResponse(Review rating) {
        return toResponse(rating, null);
    }

    /**
     * @param myVote voto do usuário autenticado nesta resenha ({@code null}
     *               quando anônimo ou sem voto).
     */
    public static ReviewResponse toResponse(Review rating, VoteValue myVote) {
        return toResponse(rating, myVote, null, null, null);
    }

    /**
     * Variante enriquecida ("minhas avaliações"): inclui capa e gêneros da obra
     * e o número de capítulos lidos pelo usuário naquele título.
     *
     * @param myVote       voto do usuário ({@code null} quando sem voto)
     * @param cover        capa da obra ({@code null} quando não enriquecido)
     * @param genres       gêneros já resolvidos para o locale ({@code null} quando não enriquecido)
     * @param chaptersRead capítulos lidos pelo usuário no título ({@code null} quando não enriquecido)
     */
    public static ReviewResponse toResponse(Review rating, VoteValue myVote, String cover, List<String> genres, Long chaptersRead) {
        if (rating == null) return null;

        return new ReviewResponse(
                rating.getId(),
                rating.getTitleId(),
                rating.getTitleName(),
                rating.getUserId(),
                rating.getUserName(),
                rating.getOverallRating(),
                rating.getFunRating(),
                rating.getArtRating(),
                rating.getStorylineRating(),
                rating.getCharactersRating(),
                rating.getOriginalityRating(),
                rating.getPacingRating(),
                rating.getTextContent(),
                rating.getReviewTitle(),
                rating.isSpoiler(),
                rating.isTop(),
                rating.getUpvotes(),
                rating.getDownvotes(),
                myVote != null ? myVote.name().toLowerCase() : null,
                rating.isEdited(),
                formatDate(rating.getCreatedAt()),
                formatDate(rating.getUpdatedAt()),
                cover,
                genres,
                chaptersRead
        );
    }

    public static List<ReviewResponse> toResponseList(List<Review> ratings) {
        if (ratings == null) return Collections.emptyList();
        return ratings.stream().map(ReviewMapper::toResponse).toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}

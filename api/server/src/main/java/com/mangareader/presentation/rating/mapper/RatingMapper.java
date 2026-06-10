package com.mangareader.presentation.rating.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.presentation.rating.dto.RatingResponse;
import com.mangareader.shared.domain.vote.VoteValue;

/**
 * Mapper para converter entidade MangaRating em DTO de resposta.
 */
public final class RatingMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private RatingMapper() {}

    public static RatingResponse toResponse(MangaRating rating) {
        return toResponse(rating, null);
    }

    /**
     * @param myVote voto do usuário autenticado nesta resenha ({@code null}
     *               quando anônimo ou sem voto).
     */
    public static RatingResponse toResponse(MangaRating rating, VoteValue myVote) {
        if (rating == null) return null;

        return new RatingResponse(
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
                formatDate(rating.getUpdatedAt())
        );
    }

    public static List<RatingResponse> toResponseList(List<MangaRating> ratings) {
        if (ratings == null) return Collections.emptyList();
        return ratings.stream().map(RatingMapper::toResponse).toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}

package com.mangareader.presentation.rating.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.presentation.rating.dto.RatingResponse;

/**
 * Mapper para converter entidade MangaRating em DTO de resposta.
 */
public final class RatingMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private RatingMapper() {}

    public static RatingResponse toResponse(MangaRating rating) {
        if (rating == null) return null;

        return new RatingResponse(
                rating.getId(),
                rating.getTitleId(),
                rating.getUserName(),
                rating.getStars(),
                rating.getComment(),
                rating.getCategoryRatings(),
                formatDate(rating.getCreatedAt())
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

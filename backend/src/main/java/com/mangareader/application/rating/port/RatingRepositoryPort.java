package com.mangareader.application.rating.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.rating.entity.MangaRating;

/**
 * Port de saída — acesso a dados de Ratings (MongoDB).
 */
public interface RatingRepositoryPort {

    List<MangaRating> findByTitleId(String titleId);

    Optional<MangaRating> findByTitleIdAndUserId(String titleId, String userId);

    Optional<MangaRating> findById(String id);

    List<MangaRating> findByUserId(String userId);

    MangaRating save(MangaRating rating);

    void deleteById(String id);

    long countByTitleId(String titleId);
}

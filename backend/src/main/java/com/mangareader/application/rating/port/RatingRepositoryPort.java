package com.mangareader.application.rating.port;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.rating.entity.MangaRating;

/**
 * Port de saída — acesso a dados de Ratings (MongoDB).
 */
public interface RatingRepositoryPort {
    Optional<MangaRating> findByTitleIdAndUserId(String titleId, String userId);

    Optional<MangaRating> findById(String id);

    MangaRating save(MangaRating rating);

    void deleteById(String id);

    long countByTitleId(String titleId);

    Page<MangaRating> findByTitleId(String titleId, Pageable pageable);

    Page<MangaRating> findByUserId(String userId, Pageable pageable);

    long countByUserId(String userId);

    /**
     * Agregação no banco: média e contagem de avaliações de um título.
     * Evita carregar a lista completa de ratings em memória (pode crescer
     * sem limite em títulos populares).
     */
    RatingAggregate aggregateByTitleId(String titleId);

    record RatingAggregate(double average, long count) {}
}

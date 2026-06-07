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

    /**
     * Avaliações de um título, opcionalmente filtradas por faixa de estrela.
     * {@code star} nulo retorna todas; caso contrário filtra por
     * {@code overallRating} ∈ [star-0.5, star+0.5) (equivale a {@code Math.round}).
     */
    Page<MangaRating> findByTitleId(String titleId, Integer star, Pageable pageable);

    Page<MangaRating> findByUserId(String userId, Pageable pageable);

    long countByUserId(String userId);

    /**
     * Agregação no banco: média e contagem de avaliações de um título.
     * Evita carregar a lista completa de ratings em memória (pode crescer
     * sem limite em títulos populares).
     */
    RatingAggregate aggregateByTitleId(String titleId);

    record RatingAggregate(double average, long count) {}

    /**
     * Agregação no banco: contagem de avaliações por faixa de estrela (1–5),
     * agrupando pelo {@code overallRating} arredondado. Alimenta o gráfico de
     * distribuição na aba de avaliações sem carregar a lista completa.
     */
    RatingDistribution distributionByTitleId(String titleId);

    record RatingDistribution(long star1, long star2, long star3, long star4, long star5) {
        public long total() {
            return star1 + star2 + star3 + star4 + star5;
        }

        public static RatingDistribution empty() {
            return new RatingDistribution(0, 0, 0, 0, 0);
        }
    }
}

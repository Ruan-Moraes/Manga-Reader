package com.mangareader.application.rating.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort.RatingDistribution;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a distribuição de avaliações de um título por faixa de estrela (1–5).
 * <p>
 * A contagem é resolvida via agregação no banco; não há cache aqui (o
 * resultado muda a cada nova avaliação e a agregação é barata).
 */
@Service
@RequiredArgsConstructor
public class GetRatingDistributionUseCase {
    private final RatingRepositoryPort ratingRepository;

    public RatingDistribution execute(String titleId) {
        return ratingRepository.distributionByTitleId(titleId);
    }
}

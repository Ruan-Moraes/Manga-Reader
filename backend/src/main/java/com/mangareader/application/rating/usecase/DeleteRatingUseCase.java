package com.mangareader.application.rating.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui uma avaliação (somente o autor pode excluir).
 */
@Service
@RequiredArgsConstructor
public class DeleteRatingUseCase {

    private final RatingRepositoryPort ratingRepository;

    public void execute(String ratingId, UUID userId) {
        MangaRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        if (!rating.getUserId().equals(userId.toString())) {
            throw new BusinessRuleException("Você só pode excluir suas próprias avaliações.", 403);
        }

        ratingRepository.deleteById(ratingId);
    }
}

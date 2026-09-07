package com.toonlira.application.review.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.review.port.ReviewRepositoryPort;
import com.toonlira.application.shared.event.RatingEvent;
import com.toonlira.application.shared.event.ReviewPostedEvent;
import com.toonlira.application.shared.port.EventPublisherPort;
import com.toonlira.application.shared.port.CacheInvalidationPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.review.entity.Review;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.constant.CacheNames;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Submete ou atualiza a avaliação de um usuário para um título.
 * <p>
 * Se o usuário já avaliou o título, atualiza a avaliação existente (upsert).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class SubmitReviewUseCase {
    private final ReviewRepositoryPort reviewRepository;
    private final UserRepositoryPort userRepository;
    private final TitleRepositoryPort titleRepository;
    private final EventPublisherPort eventPublisher;
    private final LocaleResolutionService localeResolver;
    private final CacheInvalidationPort cacheInvalidation;

    public record SubmitReviewInput(
            String titleId,
            UUID userId,
            double funRating,
            double artRating,
            double storylineRating,
            double charactersRating,
            double originalityRating,
            double pacingRating,
            String textContent,
            String reviewTitle,
            boolean spoiler
    ) {}

    public Review execute(SubmitReviewInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        // Upsert: atualiza se já existe, cria se não
        var existing = reviewRepository.findByTitleIdAndUserId(input.titleId(), input.userId().toString());
        boolean isEdit = existing.isPresent();

        Review rating = existing
                .orElseGet(() -> Review.builder()
                        .titleId(input.titleId())
                        .userId(input.userId().toString())
                        .userName(user.getName())
                        .language(localeResolver.currentLanguageTag())
                        .build()
                );

        rating.setFunRating(input.funRating());
        rating.setArtRating(input.artRating());
        rating.setStorylineRating(input.storylineRating());
        rating.setCharactersRating(input.charactersRating());
        rating.setOriginalityRating(input.originalityRating());
        rating.setPacingRating(input.pacingRating());
        rating.setOverallRating(rating.calculateOverallRating());
        rating.setTextContent(input.textContent());
        rating.setReviewTitle(input.reviewTitle());
        rating.setSpoiler(input.spoiler());
        rating.setUserName(user.getName());

        var title = titleRepository.findById(input.titleId())
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", input.titleId()));

        rating.setTitleName(localeResolver.resolve(title.getName()));

        // Edição de resenha existente marca edited + updatedAt; criação inicializa updatedAt = agora.
        rating.setUpdatedAt(java.time.LocalDateTime.now());

        if (isEdit) {
            rating.setEdited(true);
        }

        Review saved = reviewRepository.save(rating);

        eventPublisher.publish("rating.submitted", new RatingEvent(input.titleId(), input.userId().toString()));

        if (!isEdit) {
            eventPublisher.publish("activity.review-posted", new ReviewPostedEvent(
                    input.userId().toString(), input.titleId(), rating.getTitleName(), title.getCover(),
                    saved.getId(), saved.getOverallRating()));
        }

        cacheInvalidation.evictAfterCommit(CacheNames.RATING_AVERAGE, input.titleId());

        return saved;
    }
}

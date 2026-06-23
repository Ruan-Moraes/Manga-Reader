package com.mangareader.application.review.usecase;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.shared.domain.vote.VoteValue;

import lombok.RequiredArgsConstructor;

/**
 * "Minhas avaliações" enriquecidas: cada resenha do usuário acompanhada da
 * capa/gêneros da obra, do nº de capítulos lidos no título e do voto do próprio
 * usuário na resenha. Toda a coleta é em lote (uma query de títulos, uma
 * agregação de leituras, uma query de votos), sem N+1.
 * <p>
 * Devolve dados crus de domínio ({@link EnrichedReview}); a tradução de gêneros
 * para o locale e a montagem do DTO são responsabilidade da camada de
 * apresentação.
 */
@Service
@RequiredArgsConstructor
public class GetUserReviewsEnrichedUseCase {
    private final ReviewRepositoryPort reviewRepository;
    private final TitleRepositoryPort titleRepository;
    private final UserChapterReadRepositoryPort userChapterReadRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public Page<EnrichedReview> execute(UUID userId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByUserId(userId.toString(), pageable);

        if (page.isEmpty()) {
            return page.map(review -> new EnrichedReview(review, null, List.of(), 0L, null));
        }

        List<String> titleIds = page.map(Review::getTitleId).getContent().stream().distinct().toList();

        Map<String, Title> titlesById = titleRepository.findByIds(titleIds).stream()
                .collect(Collectors.toMap(Title::getId, t -> t, (a, b) -> a));

        Map<String, Long> readsByTitle = userChapterReadRepository
                .countByUserIdAndTitleIdIn(userId.toString(), titleIds);

        Map<String, VoteValue> votesByReview = reviewVoteRepository
                .findByRatingIdInAndUserId(page.map(Review::getId).getContent(), userId.toString())
                .stream()
                .collect(Collectors.toMap(v -> v.getRatingId(), v -> v.getValue(), (a, b) -> a));

        return page.map(review -> {
            Title title = titlesById.get(review.getTitleId());
            String cover = title != null ? title.getCover() : null;
            List<String> genres = title != null ? title.getGenres() : List.of();
            long chaptersRead = readsByTitle.getOrDefault(review.getTitleId(), 0L);

            return new EnrichedReview(review, cover, genres, chaptersRead, votesByReview.get(review.getId()));
        });
    }

    /**
     * Resenha com os dados crus necessários para a listagem "minhas avaliações".
     * {@code genreSlugs} são os slugs da obra (ainda não traduzidos).
     */
    public record EnrichedReview(
            Review review,
            String cover,
            List<String> genreSlugs,
            long chaptersRead,
            VoteValue myVote
    ) {}
}

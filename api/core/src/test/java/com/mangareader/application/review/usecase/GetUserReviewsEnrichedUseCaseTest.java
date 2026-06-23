package com.mangareader.application.review.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.application.review.usecase.GetUserReviewsEnrichedUseCase.EnrichedReview;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.domain.review.entity.ReviewVote;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.vote.VoteValue;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserReviewsEnrichedUseCase")
class GetUserReviewsEnrichedUseCaseTest {

    @Mock
    private ReviewRepositoryPort reviewRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private UserChapterReadRepositoryPort userChapterReadRepository;

    @Mock
    private ReviewVoteRepositoryPort reviewVoteRepository;

    @InjectMocks
    private GetUserReviewsEnrichedUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve enriquecer cada resenha com capa, gêneros, capítulos lidos e voto, em lote")
    void deveEnriquecer() {
        Review review = Review.builder().id("r1").titleId("t1").userId(USER_ID.toString()).build();
        when(reviewRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(review)));

        when(titleRepository.findByIds(anyCollection())).thenReturn(List.of(
                Title.builder().id("t1").name(LocalizedString.ofDefault("Solo Leveling"))
                        .cover("cover.jpg").genres(List.of("action", "fantasy")).build()));
        when(userChapterReadRepository.countByUserIdAndTitleIdIn(eq(USER_ID.toString()), anyCollection()))
                .thenReturn(Map.of("t1", 7L));
        when(reviewVoteRepository.findByRatingIdInAndUserId(anyCollection(), eq(USER_ID.toString())))
                .thenReturn(List.of(ReviewVote.builder().ratingId("r1").value(VoteValue.UP).build()));

        Page<EnrichedReview> result = useCase.execute(USER_ID, Pageable.unpaged());

        assertThat(result).hasSize(1);
        EnrichedReview enriched = result.getContent().get(0);
        assertThat(enriched.review().getId()).isEqualTo("r1");
        assertThat(enriched.cover()).isEqualTo("cover.jpg");
        assertThat(enriched.genreSlugs()).containsExactly("action", "fantasy");
        assertThat(enriched.chaptersRead()).isEqualTo(7L);
        assertThat(enriched.myVote()).isEqualTo(VoteValue.UP);
    }

    @Test
    @DisplayName("Página vazia não consulta títulos, leituras ou votos")
    void paginaVazia() {
        when(reviewRepository.findByUserId(eq(USER_ID.toString()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<EnrichedReview> result = useCase.execute(USER_ID, Pageable.unpaged());

        assertThat(result).isEmpty();
    }
}

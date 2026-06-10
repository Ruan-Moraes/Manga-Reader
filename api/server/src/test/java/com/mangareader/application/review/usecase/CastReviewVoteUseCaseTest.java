package com.mangareader.application.review.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.domain.review.entity.ReviewVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CastReviewVoteUseCase")
class CastReviewVoteUseCaseTest {

    @Mock
    private ReviewRepositoryPort ratingRepository;

    @Mock
    private ReviewVoteRepositoryPort reviewVoteRepository;

    @InjectMocks
    private CastReviewVoteUseCase useCase;

    private final String RATING_ID = "rating-1";
    private final UUID VOTER = UUID.randomUUID();
    private final UUID AUTHOR = UUID.randomUUID();

    private Review rating(long up, long down) {
        return Review.builder()
                .id(RATING_ID)
                .titleId("t1")
                .userId(AUTHOR.toString())
                .upvotes(up)
                .downvotes(down)
                .build();
    }

    @Test
    @DisplayName("Sem voto anterior: cria voto e incrementa upvotes")
    void deveCriarVotoNovo() {
        Review r = rating(3, 0);
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(r));
        when(reviewVoteRepository.findByRatingIdAndUserId(RATING_ID, VOTER.toString())).thenReturn(Optional.empty());

        VoteResult result = useCase.execute(RATING_ID, VOTER, VoteValue.UP);

        assertThat(result.upvotes()).isEqualTo(4);
        assertThat(result.myVote()).isEqualTo(VoteValue.UP);

        ArgumentCaptor<ReviewVote> captor = ArgumentCaptor.forClass(ReviewVote.class);
        verify(reviewVoteRepository).save(captor.capture());
        assertThat(captor.getValue().getValue()).isEqualTo(VoteValue.UP);
        verify(ratingRepository).save(r);
    }

    @Test
    @DisplayName("Mesmo lado: remove o voto (toggle off) e decrementa")
    void deveRemoverNoToggle() {
        Review r = rating(4, 0);
        var existing = ReviewVote.builder().ratingId(RATING_ID).userId(VOTER.toString()).value(VoteValue.UP).build();
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(r));
        when(reviewVoteRepository.findByRatingIdAndUserId(RATING_ID, VOTER.toString())).thenReturn(Optional.of(existing));

        VoteResult result = useCase.execute(RATING_ID, VOTER, VoteValue.UP);

        assertThat(result.upvotes()).isEqualTo(3);
        assertThat(result.myVote()).isNull();
        verify(reviewVoteRepository).delete(existing);
    }

    @Test
    @DisplayName("Lado oposto: troca o voto ajustando os dois contadores")
    void deveTrocarLado() {
        Review r = rating(4, 2);
        var existing = ReviewVote.builder().ratingId(RATING_ID).userId(VOTER.toString()).value(VoteValue.UP).build();
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(r));
        when(reviewVoteRepository.findByRatingIdAndUserId(RATING_ID, VOTER.toString())).thenReturn(Optional.of(existing));

        VoteResult result = useCase.execute(RATING_ID, VOTER, VoteValue.DOWN);

        assertThat(result.upvotes()).isEqualTo(3);
        assertThat(result.downvotes()).isEqualTo(3);
        assertThat(result.myVote()).isEqualTo(VoteValue.DOWN);
        assertThat(existing.getValue()).isEqualTo(VoteValue.DOWN);
        verify(reviewVoteRepository).save(existing);
    }

    @Test
    @DisplayName("Deve lançar BusinessRuleException 409 ao votar na própria resenha")
    void deveProibirVotoProprio() {
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(rating(0, 0)));

        assertThatThrownBy(() -> useCase.execute(RATING_ID, AUTHOR, VoteValue.UP))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(409));

        verify(reviewVoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando a resenha não existe")
    void deveLancarQuandoResenhaNaoExiste() {
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(RATING_ID, VOTER, VoteValue.UP))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Rating");
    }
}

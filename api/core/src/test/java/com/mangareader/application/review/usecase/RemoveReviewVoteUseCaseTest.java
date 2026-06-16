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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.domain.review.entity.ReviewVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RemoveReviewVoteUseCase")
class RemoveReviewVoteUseCaseTest {

    @Mock
    private ReviewRepositoryPort ratingRepository;

    @Mock
    private ReviewVoteRepositoryPort reviewVoteRepository;

    @InjectMocks
    private RemoveReviewVoteUseCase useCase;

    private final String RATING_ID = "rating-1";
    private final UUID VOTER = UUID.randomUUID();

    private Review rating(long up, long down) {
        return Review.builder().id(RATING_ID).titleId("t1").userId("author").upvotes(up).downvotes(down).build();
    }

    @Test
    @DisplayName("Deve remover o voto e decrementar o contador correspondente")
    void deveRemoverVoto() {
        Review r = rating(5, 1);
        var existing = ReviewVote.builder().ratingId(RATING_ID).userId(VOTER.toString()).value(VoteValue.UP).build();
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(r));
        when(reviewVoteRepository.findByRatingIdAndUserId(RATING_ID, VOTER.toString())).thenReturn(Optional.of(existing));

        VoteResult result = useCase.execute(RATING_ID, VOTER);

        assertThat(result.upvotes()).isEqualTo(4);
        assertThat(result.myVote()).isNull();
        verify(reviewVoteRepository).delete(existing);
        verify(ratingRepository).save(r);
    }

    @Test
    @DisplayName("Idempotente: sem voto apenas retorna contadores, sem salvar")
    void deveSerIdempotenteSemVoto() {
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.of(rating(5, 1)));
        when(reviewVoteRepository.findByRatingIdAndUserId(RATING_ID, VOTER.toString())).thenReturn(Optional.empty());

        VoteResult result = useCase.execute(RATING_ID, VOTER);

        assertThat(result.upvotes()).isEqualTo(5);
        verify(reviewVoteRepository, never()).delete(any());
        verify(ratingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando a resenha não existe")
    void deveLancarQuandoResenhaNaoExiste() {
        when(ratingRepository.findById(RATING_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(RATING_ID, VOTER))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

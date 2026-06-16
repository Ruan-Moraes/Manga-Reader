package com.mangareader.application.review.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.domain.review.entity.Review;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetReviewsByTitleUseCase")
class GetRatingsByTitleUseCaseTest {

    @Mock
    private ReviewRepositoryPort ratingRepository;

    @InjectMocks
    private GetReviewsByTitleUseCase getRatingsByTitleUseCase;

    private final String TITLE_ID = "title-list-456";

    @Nested
    @DisplayName("Consultas paginadas")
    class ConsultasPaginadas {

        @Test
        @DisplayName("Deve retornar página com avaliações do título")
        void deveRetornarPaginaComAvaliacoes() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            List<Review> ratings = List.of(
                    Review.builder().id("r1").titleId(TITLE_ID).overallRating(5.0).userName("User A").build(),
                    Review.builder().id("r2").titleId(TITLE_ID).overallRating(3.5).userName("User B").build(),
                    Review.builder().id("r3").titleId(TITLE_ID).overallRating(4.0).userName("User C").build()
            );
            Page<Review> page = new PageImpl<>(ratings, pageable, 3);
            when(ratingRepository.findByTitleId(TITLE_ID, null, pageable)).thenReturn(page);

            // Act
            Page<Review> result = getRatingsByTitleUseCase.execute(TITLE_ID, null, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getContent().get(0).getUserName()).isEqualTo("User A");
        }

        @Test
        @DisplayName("Deve retornar página vazia quando título não tem avaliações")
        void deveRetornarPaginaVazia() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<Review> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(ratingRepository.findByTitleId(TITLE_ID, null, pageable)).thenReturn(emptyPage);

            // Act
            Page<Review> result = getRatingsByTitleUseCase.execute(TITLE_ID, null, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("Deve repassar o filtro de estrela ao repositório")
        void deveRepassarFiltroDeEstrela() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Review> page = new PageImpl<>(
                    List.of(Review.builder().id("r1").titleId(TITLE_ID).overallRating(5.0).build()), pageable, 1);
            when(ratingRepository.findByTitleId(TITLE_ID, 5, pageable)).thenReturn(page);

            Page<Review> result = getRatingsByTitleUseCase.execute(TITLE_ID, 5, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}

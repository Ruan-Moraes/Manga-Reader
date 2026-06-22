package com.mangareader.application.review.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

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
@DisplayName("GetUserReviewsUseCase")
class GetUserRatingsUseCaseTest {

    @Mock
    private ReviewRepositoryPort reviewRepository;

    @InjectMocks
    private GetUserReviewsUseCase getUserRatingsUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Nested
    @DisplayName("Consultas paginadas")
    class ConsultasPaginadas {

        @Test
        @DisplayName("Deve retornar página com avaliações do usuário")
        void deveRetornarPaginaComAvaliacoes() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            List<Review> ratings = List.of(
                    Review.builder().id("r1").titleId("t1").userId(USER_ID.toString()).overallRating(4.0).build(),
                    Review.builder().id("r2").titleId("t2").userId(USER_ID.toString()).overallRating(5.0).build()
            );
            Page<Review> page = new PageImpl<>(ratings, pageable, 2);
            when(reviewRepository.findByUserId(USER_ID.toString(), pageable)).thenReturn(page);

            // Act
            Page<Review> result = getUserRatingsUseCase.execute(USER_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar página vazia quando usuário não tem avaliações")
        void deveRetornarPaginaVazia() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Review> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(reviewRepository.findByUserId(USER_ID.toString(), pageable)).thenReturn(emptyPage);

            // Act
            Page<Review> result = getUserRatingsUseCase.execute(USER_ID, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }
}

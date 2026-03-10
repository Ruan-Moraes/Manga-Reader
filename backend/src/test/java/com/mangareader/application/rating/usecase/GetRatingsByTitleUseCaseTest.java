package com.mangareader.application.rating.usecase;

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

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRatingsByTitleUseCase")
class GetRatingsByTitleUseCaseTest {

    @Mock
    private RatingRepositoryPort ratingRepository;

    @InjectMocks
    private GetRatingsByTitleUseCase getRatingsByTitleUseCase;

    private final String TITLE_ID = "title-list-456";

    @Nested
    @DisplayName("Consultas paginadas")
    class ConsultasPaginadas {

        @Test
        @DisplayName("Deve retornar página com avaliações do título")
        void deveRetornarPaginaComAvaliacoes() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            List<MangaRating> ratings = List.of(
                    MangaRating.builder().id("r1").titleId(TITLE_ID).stars(5.0).userName("User A").build(),
                    MangaRating.builder().id("r2").titleId(TITLE_ID).stars(3.5).userName("User B").build(),
                    MangaRating.builder().id("r3").titleId(TITLE_ID).stars(4.0).userName("User C").build()
            );
            Page<MangaRating> page = new PageImpl<>(ratings, pageable, 3);
            when(ratingRepository.findByTitleId(TITLE_ID, pageable)).thenReturn(page);

            // Act
            Page<MangaRating> result = getRatingsByTitleUseCase.execute(TITLE_ID, pageable);

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
            Page<MangaRating> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(ratingRepository.findByTitleId(TITLE_ID, pageable)).thenReturn(emptyPage);

            // Act
            Page<MangaRating> result = getRatingsByTitleUseCase.execute(TITLE_ID, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }
}

package com.mangareader.domain.rating.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class MangaRatingTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve iniciar com campos de categoria zerados no builder padrão")
        void shouldInitializeDefaultCategoryRatings() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .userName("João")
                    .funRating(4.0)
                    .artRating(5.0)
                    .storylineRating(3.5)
                    .charactersRating(4.0)
                    .originalityRating(3.0)
                    .pacingRating(4.5)
                    .build();

            assertEquals(4.0, rating.getFunRating());
            assertEquals(5.0, rating.getArtRating());
            assertEquals(3.5, rating.getStorylineRating());
            assertEquals(4.0, rating.getCharactersRating());
            assertEquals(3.0, rating.getOriginalityRating());
            assertEquals(4.5, rating.getPacingRating());
        }

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            MangaRating rating = MangaRating.builder()
                    .id("rating-abc")
                    .titleId("title-1")
                    .userId("user-1")
                    .userName("Maria")
                    .titleName("Solo Leveling")
                    .funRating(4.5)
                    .artRating(5.0)
                    .storylineRating(4.0)
                    .charactersRating(3.5)
                    .originalityRating(4.0)
                    .pacingRating(3.0)
                    .overallRating(4.0)
                    .comment("Excelente mangá!")
                    .build();

            assertEquals("rating-abc", rating.getId());
            assertEquals("title-1", rating.getTitleId());
            assertEquals("user-1", rating.getUserId());
            assertEquals("Maria", rating.getUserName());
            assertEquals("Solo Leveling", rating.getTitleName());
            assertEquals(4.5, rating.getFunRating());
            assertEquals(5.0, rating.getArtRating());
            assertEquals(4.0, rating.getStorylineRating());
            assertEquals(3.5, rating.getCharactersRating());
            assertEquals(4.0, rating.getOriginalityRating());
            assertEquals(3.0, rating.getPacingRating());
            assertEquals(4.0, rating.getOverallRating());
            assertEquals("Excelente mangá!", rating.getComment());
        }

        @Test
        @DisplayName("Deve permitir avaliação sem comentário")
        void shouldAllowRatingWithoutComment() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .funRating(3.0)
                    .artRating(3.0)
                    .storylineRating(3.0)
                    .charactersRating(3.0)
                    .originalityRating(3.0)
                    .pacingRating(3.0)
                    .build();

            assertEquals(3.0, rating.getFunRating());
            assertNull(rating.getComment());
        }
    }

    @Nested
    @DisplayName("Cálculo do overallRating")
    class OverallRatingTests {

        @Test
        @DisplayName("Deve calcular overallRating como média das 6 categorias")
        void shouldCalculateOverallRating() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .funRating(4.0)
                    .artRating(5.0)
                    .storylineRating(3.0)
                    .charactersRating(4.0)
                    .originalityRating(3.0)
                    .pacingRating(5.0)
                    .build();

            // (4.0 + 5.0 + 3.0 + 4.0 + 3.0 + 5.0) / 6 = 24.0 / 6 = 4.0
            assertEquals(4.0, rating.calculateOverallRating());
        }

        @Test
        @DisplayName("Deve arredondar para 1 casa decimal")
        void shouldRoundToOneDecimalPlace() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .funRating(4.5)
                    .artRating(3.7)
                    .storylineRating(4.2)
                    .charactersRating(3.8)
                    .originalityRating(4.1)
                    .pacingRating(3.9)
                    .build();

            // (4.5 + 3.7 + 4.2 + 3.8 + 4.1 + 3.9) / 6 = 24.2 / 6 = 4.0333... → 4.0
            assertEquals(4.0, rating.calculateOverallRating());
        }

        @Test
        @DisplayName("Deve retornar 0.0 quando todas as categorias são zero")
        void shouldReturnZeroWhenAllCategoriesAreZero() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .build();

            assertEquals(0.0, rating.calculateOverallRating());
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve permitir atualizar campos de categoria e comentário")
        void shouldAllowUpdatingCategoryRatingsAndComment() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .funRating(3.0)
                    .artRating(3.0)
                    .storylineRating(3.0)
                    .charactersRating(3.0)
                    .originalityRating(3.0)
                    .pacingRating(3.0)
                    .comment("Bom")
                    .build();

            rating.setFunRating(5.0);
            rating.setArtRating(4.5);
            rating.setComment("Na verdade, é perfeito!");

            assertEquals(5.0, rating.getFunRating());
            assertEquals(4.5, rating.getArtRating());
            assertEquals("Na verdade, é perfeito!", rating.getComment());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos e numéricos zerados")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            MangaRating rating = new MangaRating();

            assertNull(rating.getId());
            assertNull(rating.getTitleId());
            assertNull(rating.getUserId());
            assertNull(rating.getUserName());
            assertNull(rating.getTitleName());
            assertNull(rating.getComment());
            assertNull(rating.getCreatedAt());
            assertEquals(0.0, rating.getOverallRating());
            assertEquals(0.0, rating.getFunRating());
        }
    }
}

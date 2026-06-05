package com.mangareader.domain.rating.entity;

import static org.assertj.core.api.Assertions.assertThat;

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

            assertThat(rating.getFunRating()).isEqualTo(4.0);
            assertThat(rating.getArtRating()).isEqualTo(5.0);
            assertThat(rating.getStorylineRating()).isEqualTo(3.5);
            assertThat(rating.getCharactersRating()).isEqualTo(4.0);
            assertThat(rating.getOriginalityRating()).isEqualTo(3.0);
            assertThat(rating.getPacingRating()).isEqualTo(4.5);
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

            assertThat(rating.getId()).isEqualTo("rating-abc");
            assertThat(rating.getTitleId()).isEqualTo("title-1");
            assertThat(rating.getUserId()).isEqualTo("user-1");
            assertThat(rating.getUserName()).isEqualTo("Maria");
            assertThat(rating.getTitleName()).isEqualTo("Solo Leveling");
            assertThat(rating.getFunRating()).isEqualTo(4.5);
            assertThat(rating.getArtRating()).isEqualTo(5.0);
            assertThat(rating.getStorylineRating()).isEqualTo(4.0);
            assertThat(rating.getCharactersRating()).isEqualTo(3.5);
            assertThat(rating.getOriginalityRating()).isEqualTo(4.0);
            assertThat(rating.getPacingRating()).isEqualTo(3.0);
            assertThat(rating.getOverallRating()).isEqualTo(4.0);
            assertThat(rating.getComment()).isEqualTo("Excelente mangá!");
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

            assertThat(rating.getFunRating()).isEqualTo(3.0);
            assertThat(rating.getComment()).isNull();
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
            assertThat(rating.calculateOverallRating()).isEqualTo(4.0);
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
            assertThat(rating.calculateOverallRating()).isEqualTo(4.0);
        }

        @Test
        @DisplayName("Deve retornar 0.0 quando todas as categorias são zero")
        void shouldReturnZeroWhenAllCategoriesAreZero() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .build();

            assertThat(rating.calculateOverallRating()).isEqualTo(0.0);
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

            assertThat(rating.getFunRating()).isEqualTo(5.0);
            assertThat(rating.getArtRating()).isEqualTo(4.5);
            assertThat(rating.getComment()).isEqualTo("Na verdade, é perfeito!");
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos e numéricos zerados")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            MangaRating rating = new MangaRating();

            assertThat(rating.getId()).isNull();
            assertThat(rating.getTitleId()).isNull();
            assertThat(rating.getUserId()).isNull();
            assertThat(rating.getUserName()).isNull();
            assertThat(rating.getTitleName()).isNull();
            assertThat(rating.getComment()).isNull();
            assertThat(rating.getCreatedAt()).isNull();
            assertThat(rating.getOverallRating()).isEqualTo(0.0);
            assertThat(rating.getFunRating()).isEqualTo(0.0);
        }
    }
}

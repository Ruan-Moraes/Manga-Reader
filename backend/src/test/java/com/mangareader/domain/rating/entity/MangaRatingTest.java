package com.mangareader.domain.rating.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class MangaRatingTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve iniciar com categoryRatings vazio no builder padrão")
        void shouldInitializeDefaultCategoryRatings() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .userName("João")
                    .stars(4.5)
                    .build();

            assertNotNull(rating.getCategoryRatings());
            assertTrue(rating.getCategoryRatings().isEmpty());
        }

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            Map<String, Double> categories = new HashMap<>();
            categories.put("fun", 4.5);
            categories.put("art", 5.0);
            categories.put("storyline", 4.0);

            MangaRating rating = MangaRating.builder()
                    .id("rating-abc")
                    .titleId("title-1")
                    .userId("user-1")
                    .userName("Maria")
                    .stars(4.5)
                    .comment("Excelente mangá!")
                    .categoryRatings(categories)
                    .build();

            assertEquals("rating-abc", rating.getId());
            assertEquals("title-1", rating.getTitleId());
            assertEquals("user-1", rating.getUserId());
            assertEquals("Maria", rating.getUserName());
            assertEquals(4.5, rating.getStars());
            assertEquals("Excelente mangá!", rating.getComment());
            assertEquals(3, rating.getCategoryRatings().size());
            assertEquals(5.0, rating.getCategoryRatings().get("art"));
        }

        @Test
        @DisplayName("Deve permitir avaliação sem comentário (apenas estrelas)")
        void shouldAllowRatingWithoutComment() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .stars(3.0)
                    .build();

            assertEquals(3.0, rating.getStars());
            assertNull(rating.getComment());
        }
    }

    @Nested
    @DisplayName("Category Ratings")
    class CategoryRatingsTests {

        @Test
        @DisplayName("Deve suportar avaliações por categoria")
        void shouldSupportCategoryRatings() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .stars(4.0)
                    .build();

            rating.getCategoryRatings().put("fun", 4.5);
            rating.getCategoryRatings().put("art", 5.0);
            rating.getCategoryRatings().put("storyline", 3.5);

            assertEquals(3, rating.getCategoryRatings().size());
            assertEquals(4.5, rating.getCategoryRatings().get("fun"));
            assertEquals(5.0, rating.getCategoryRatings().get("art"));
            assertEquals(3.5, rating.getCategoryRatings().get("storyline"));
        }

        @Test
        @DisplayName("Deve permitir sobrescrever categoryRatings no builder")
        void shouldOverrideCategoryRatingsInBuilder() {
            Map<String, Double> categories = Map.of("fun", 3.0, "art", 4.0);

            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .stars(3.5)
                    .categoryRatings(new HashMap<>(categories))
                    .build();

            assertEquals(2, rating.getCategoryRatings().size());
            assertEquals(3.0, rating.getCategoryRatings().get("fun"));
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve permitir atualizar estrelas e comentário")
        void shouldAllowUpdatingStarsAndComment() {
            MangaRating rating = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .stars(3.0)
                    .comment("Bom")
                    .build();

            rating.setStars(5.0);
            rating.setComment("Na verdade, é perfeito!");

            assertEquals(5.0, rating.getStars());
            assertEquals("Na verdade, é perfeito!", rating.getComment());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            MangaRating rating = new MangaRating();

            assertNull(rating.getId());
            assertNull(rating.getTitleId());
            assertNull(rating.getUserId());
            assertNull(rating.getUserName());
            assertNull(rating.getComment());
            assertNull(rating.getCreatedAt());
        }
    }
}

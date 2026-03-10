package com.mangareader.domain.news.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;

class NewsItemTest {

    @Nested
    @DisplayName("Builder — valores default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve iniciar com defaults corretos no builder")
        void shouldInitializeDefaults() {
            NewsItem news = NewsItem.builder()
                    .title("Nova serialização anunciada")
                    .category(NewsCategory.LANCAMENTOS)
                    .build();

            assertNotNull(news.getContent());
            assertTrue(news.getContent().isEmpty());
            assertNotNull(news.getGallery());
            assertTrue(news.getGallery().isEmpty());
            assertNotNull(news.getTags());
            assertTrue(news.getTags().isEmpty());
            assertEquals(0, news.getReadTime());
            assertEquals(0, news.getViews());
            assertEquals(0, news.getCommentsCount());
            assertEquals(0, news.getTrendingScore());
            assertFalse(news.isExclusive());
            assertFalse(news.isFeatured());
            assertNotNull(news.getTechnicalSheet());
            assertTrue(news.getTechnicalSheet().isEmpty());
            assertNotNull(news.getReactions());
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            NewsAuthor author = NewsAuthor.builder()
                    .id("author-1")
                    .name("Carlos Editor")
                    .avatar("https://example.com/carlos.jpg")
                    .role("Editor Chefe")
                    .profileLink("/profiles/carlos")
                    .build();

            NewsReaction reactions = NewsReaction.builder()
                    .like(100)
                    .excited(50)
                    .sad(10)
                    .surprised(25)
                    .build();

            NewsItem news = NewsItem.builder()
                    .id("news-abc")
                    .title("One Piece ganha adaptação live action S2")
                    .subtitle("Netflix anuncia segunda temporada")
                    .excerpt("A Netflix confirmou oficialmente...")
                    .content(List.of("Parágrafo 1", "Parágrafo 2", "Parágrafo 3"))
                    .coverImage("https://example.com/cover.jpg")
                    .gallery(List.of("img1.jpg", "img2.jpg"))
                    .source("Netflix Brasil")
                    .sourceLogo("https://example.com/netflix-logo.png")
                    .category(NewsCategory.ADAPTACOES)
                    .tags(List.of("one-piece", "netflix", "live-action"))
                    .author(author)
                    .readTime(5)
                    .views(10000)
                    .commentsCount(42)
                    .trendingScore(95)
                    .isExclusive(true)
                    .isFeatured(true)
                    .videoUrl("https://youtube.com/watch?v=abc")
                    .technicalSheet(Map.of("Diretor", "Matt Owens", "Estúdio", "Tomorrow Studios"))
                    .reactions(reactions)
                    .build();

            assertEquals("news-abc", news.getId());
            assertEquals("One Piece ganha adaptação live action S2", news.getTitle());
            assertEquals("Netflix anuncia segunda temporada", news.getSubtitle());
            assertEquals(NewsCategory.ADAPTACOES, news.getCategory());
            assertEquals(3, news.getContent().size());
            assertEquals(3, news.getTags().size());
            assertEquals(5, news.getReadTime());
            assertEquals(10000, news.getViews());
            assertEquals(42, news.getCommentsCount());
            assertEquals(95, news.getTrendingScore());
            assertTrue(news.isExclusive());
            assertTrue(news.isFeatured());
            assertEquals("https://youtube.com/watch?v=abc", news.getVideoUrl());
            assertEquals("Matt Owens", news.getTechnicalSheet().get("Diretor"));
            assertEquals(100, news.getReactions().getLike());
            assertEquals(50, news.getReactions().getExcited());
        }
    }

    @Nested
    @DisplayName("NewsAuthor")
    class AuthorTests {

        @Test
        @DisplayName("Deve criar autor com todos os campos")
        void shouldCreateAuthorWithAllFields() {
            NewsAuthor author = NewsAuthor.builder()
                    .id("a1")
                    .name("Editor")
                    .avatar("avatar.jpg")
                    .role("Redator")
                    .profileLink("/editor")
                    .build();

            assertEquals("a1", author.getId());
            assertEquals("Editor", author.getName());
            assertEquals("Redator", author.getRole());
        }

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgs() {
            NewsAuthor author = new NewsAuthor();

            assertNull(author.getId());
            assertNull(author.getName());
            assertNull(author.getAvatar());
            assertNull(author.getRole());
            assertNull(author.getProfileLink());
        }
    }

    @Nested
    @DisplayName("NewsReaction")
    class ReactionTests {

        @Test
        @DisplayName("Deve criar reação com contadores default (0)")
        void shouldHaveDefaultZeroReactions() {
            NewsReaction reaction = new NewsReaction();

            assertEquals(0, reaction.getLike());
            assertEquals(0, reaction.getExcited());
            assertEquals(0, reaction.getSad());
            assertEquals(0, reaction.getSurprised());
        }

        @Test
        @DisplayName("Deve suportar incremento de reações via setter")
        void shouldSupportReactionIncrement() {
            NewsReaction reaction = new NewsReaction();

            reaction.setLike(reaction.getLike() + 1);
            reaction.setExcited(reaction.getExcited() + 1);

            assertEquals(1, reaction.getLike());
            assertEquals(1, reaction.getExcited());
        }
    }

    @Nested
    @DisplayName("NewsCategory enum")
    class CategoryTests {

        @Test
        @DisplayName("Deve ter 9 categorias de notícia")
        void shouldHaveNineCategories() {
            assertEquals(9, NewsCategory.values().length);
        }

        @Test
        @DisplayName("Todas as categorias devem ter displayName")
        void allCategoriesShouldHaveDisplayName() {
            for (NewsCategory cat : NewsCategory.values()) {
                assertNotNull(cat.getDisplayName());
                assertFalse(cat.getDisplayName().isBlank());
            }
        }

        @Test
        @DisplayName("LANCAMENTOS deve ter displayName 'Lançamentos'")
        void lancamentosShouldHaveCorrectDisplayName() {
            assertEquals("Lançamentos", NewsCategory.LANCAMENTOS.getDisplayName());
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve incrementar views e trending score")
        void shouldIncrementViewsAndTrending() {
            NewsItem news = NewsItem.builder()
                    .title("Notícia teste")
                    .category(NewsCategory.PRINCIPAIS)
                    .build();

            assertEquals(0, news.getViews());
            news.setViews(news.getViews() + 1);
            assertEquals(1, news.getViews());

            news.setTrendingScore(50);
            assertEquals(50, news.getTrendingScore());
        }

        @Test
        @DisplayName("Deve marcar como featured e exclusive")
        void shouldMarkAsFeaturedAndExclusive() {
            NewsItem news = NewsItem.builder()
                    .title("Notícia especial")
                    .category(NewsCategory.ENTREVISTAS)
                    .build();

            assertFalse(news.isFeatured());
            assertFalse(news.isExclusive());

            news.setFeatured(true);
            news.setExclusive(true);

            assertTrue(news.isFeatured());
            assertTrue(news.isExclusive());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            NewsItem news = new NewsItem();

            assertNull(news.getId());
            assertNull(news.getTitle());
            assertNull(news.getSubtitle());
            assertNull(news.getExcerpt());
            assertNull(news.getCategory());
            assertNull(news.getAuthor());
            assertNull(news.getPublishedAt());
            assertNull(news.getUpdatedAt());
            assertNull(news.getVideoUrl());
        }
    }
}

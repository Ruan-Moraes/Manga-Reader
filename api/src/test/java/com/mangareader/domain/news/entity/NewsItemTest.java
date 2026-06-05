package com.mangareader.domain.news.entity;

import static org.assertj.core.api.Assertions.assertThat;

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
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Nova serialização anunciada"))
                    .category(NewsCategory.LANCAMENTOS)
                    .build();

            assertThat(news.getContent().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isNotNull();
            assertThat(news.getContent().isEmpty()).isTrue();
            assertThat(news.getGallery()).isNotNull();
            assertThat(news.getGallery().isEmpty()).isTrue();
            assertThat(news.getTags()).isNotNull();
            assertThat(news.getTags().isEmpty()).isTrue();
            assertThat(news.getReadTime()).isEqualTo(0);
            assertThat(news.getViews()).isEqualTo(0);
            assertThat(news.getCommentsCount()).isEqualTo(0);
            assertThat(news.getTrendingScore()).isEqualTo(0);
            assertThat(news.isExclusive()).isFalse();
            assertThat(news.isFeatured()).isFalse();
            assertThat(news.getTechnicalSheet()).isNotNull();
            assertThat(news.getTechnicalSheet().isEmpty()).isTrue();
            assertThat(news.getReactions()).isNotNull();
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
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("One Piece ganha adaptação live action S2"))
                    .subtitle(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Netflix anuncia segunda temporada"))
                    .excerpt(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("A Netflix confirmou oficialmente..."))
                    .content(com.mangareader.shared.domain.i18n.LocalizedStringList.ofDefault(List.of("Parágrafo 1", "Parágrafo 2", "Parágrafo 3")))
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

            assertThat(news.getId()).isEqualTo("news-abc");
            assertThat(news.getTitle().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("One Piece ganha adaptação live action S2");
            assertThat(news.getSubtitle().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Netflix anuncia segunda temporada");
            assertThat(news.getCategory()).isEqualTo(NewsCategory.ADAPTACOES);
            assertThat(news.getContent().resolve(java.util.Locale.forLanguageTag("pt-BR")).size()).isEqualTo(3);
            assertThat(news.getTags().size()).isEqualTo(3);
            assertThat(news.getReadTime()).isEqualTo(5);
            assertThat(news.getViews()).isEqualTo(10000);
            assertThat(news.getCommentsCount()).isEqualTo(42);
            assertThat(news.getTrendingScore()).isEqualTo(95);
            assertThat(news.isExclusive()).isTrue();
            assertThat(news.isFeatured()).isTrue();
            assertThat(news.getVideoUrl()).isEqualTo("https://youtube.com/watch?v=abc");
            assertThat(news.getTechnicalSheet().get("Diretor")).isEqualTo("Matt Owens");
            assertThat(news.getReactions().getLike()).isEqualTo(100);
            assertThat(news.getReactions().getExcited()).isEqualTo(50);
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

            assertThat(author.getId()).isEqualTo("a1");
            assertThat(author.getName()).isEqualTo("Editor");
            assertThat(author.getRole()).isEqualTo("Redator");
        }

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgs() {
            NewsAuthor author = new NewsAuthor();

            assertThat(author.getId()).isNull();
            assertThat(author.getName()).isNull();
            assertThat(author.getAvatar()).isNull();
            assertThat(author.getRole()).isNull();
            assertThat(author.getProfileLink()).isNull();
        }
    }

    @Nested
    @DisplayName("NewsReaction")
    class ReactionTests {

        @Test
        @DisplayName("Deve criar reação com contadores default (0)")
        void shouldHaveDefaultZeroReactions() {
            NewsReaction reaction = new NewsReaction();

            assertThat(reaction.getLike()).isEqualTo(0);
            assertThat(reaction.getExcited()).isEqualTo(0);
            assertThat(reaction.getSad()).isEqualTo(0);
            assertThat(reaction.getSurprised()).isEqualTo(0);
        }

        @Test
        @DisplayName("Deve suportar incremento de reações via setter")
        void shouldSupportReactionIncrement() {
            NewsReaction reaction = new NewsReaction();

            reaction.setLike(reaction.getLike() + 1);
            reaction.setExcited(reaction.getExcited() + 1);

            assertThat(reaction.getLike()).isEqualTo(1);
            assertThat(reaction.getExcited()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("NewsCategory enum")
    class CategoryTests {

        @Test
        @DisplayName("Deve ter 9 categorias de notícia")
        void shouldHaveNineCategories() {
            assertThat(NewsCategory.values().length).isEqualTo(9);
        }

        @Test
        @DisplayName("Todas as categorias devem ter displayName")
        void allCategoriesShouldHaveDisplayName() {
            for (NewsCategory cat : NewsCategory.values()) {
                assertThat(cat.getDisplayName()).isNotNull();
                assertThat(cat.getDisplayName().isBlank()).isFalse();
            }
        }

        @Test
        @DisplayName("LANCAMENTOS deve ter displayName 'Lançamentos'")
        void lancamentosShouldHaveCorrectDisplayName() {
            assertThat(NewsCategory.LANCAMENTOS.getDisplayName()).isEqualTo("Lançamentos");
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve incrementar views e trending score")
        void shouldIncrementViewsAndTrending() {
            NewsItem news = NewsItem.builder()
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Notícia teste"))
                    .category(NewsCategory.PRINCIPAIS)
                    .build();

            assertThat(news.getViews()).isEqualTo(0);
            news.setViews(news.getViews() + 1);
            assertThat(news.getViews()).isEqualTo(1);

            news.setTrendingScore(50);
            assertThat(news.getTrendingScore()).isEqualTo(50);
        }

        @Test
        @DisplayName("Deve marcar como featured e exclusive")
        void shouldMarkAsFeaturedAndExclusive() {
            NewsItem news = NewsItem.builder()
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Notícia especial"))
                    .category(NewsCategory.ENTREVISTAS)
                    .build();

            assertThat(news.isFeatured()).isFalse();
            assertThat(news.isExclusive()).isFalse();

            news.setFeatured(true);
            news.setExclusive(true);

            assertThat(news.isFeatured()).isTrue();
            assertThat(news.isExclusive()).isTrue();
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            NewsItem news = new NewsItem();

            assertThat(news.getId()).isNull();
            assertThat(news.getTitle().isEmpty()).isTrue();
            assertThat(news.getSubtitle().isEmpty()).isTrue();
            assertThat(news.getExcerpt().isEmpty()).isTrue();
            assertThat(news.getCategory()).isNull();
            assertThat(news.getAuthor()).isNull();
            assertThat(news.getPublishedAt()).isNull();
            assertThat(news.getUpdatedAt()).isNull();
            assertThat(news.getVideoUrl()).isNull();
        }
    }
}

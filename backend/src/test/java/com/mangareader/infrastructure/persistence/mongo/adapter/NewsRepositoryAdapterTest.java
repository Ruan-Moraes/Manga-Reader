package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.infrastructure.persistence.mongo.repository.NewsMongoRepository;

@DataMongoTest
@Testcontainers
@ActiveProfiles("test")
@Import(NewsRepositoryAdapter.class)
@DisplayName("NewsRepositoryAdapter — Integração MongoDB")
class NewsRepositoryAdapterTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private NewsRepositoryPort newsRepository;

    @Autowired
    private NewsMongoRepository mongoRepository;

    private NewsItem news1;
    private NewsItem news2;
    private NewsItem news3;

    @BeforeEach
    void setUp() {
        mongoRepository.deleteAll();

        news1 = mongoRepository.save(NewsItem.builder()
                .title("Novo capítulo de One Piece revelado")
                .subtitle("Oda surpreende fãs com plot twist")
                .excerpt("O capítulo mais recente trouxe revelações surpreendentes")
                .content(List.of("Parágrafo 1", "Parágrafo 2"))
                .coverImage("onepiece-news.jpg")
                .category(NewsCategory.LANCAMENTOS)
                .tags(List.of("one-piece", "manga", "shonen"))
                .author(NewsAuthor.builder()
                        .name("Editor")
                        .role("Redator")
                        .build())
                .readTime(5)
                .views(1000)
                .isFeatured(true)
                .reactions(NewsReaction.builder().like(50).excited(30).build())
                .build());

        news2 = mongoRepository.save(NewsItem.builder()
                .title("Anime de Chainsaw Man confirmado para 2026")
                .subtitle("Segunda temporada em produção")
                .excerpt("MAPPA confirma continuação do anime")
                .category(NewsCategory.ADAPTACOES)
                .tags(List.of("chainsaw-man", "anime"))
                .readTime(3)
                .build());

        news3 = mongoRepository.save(NewsItem.builder()
                .title("Entrevista exclusiva com Akira Toriyama")
                .subtitle("Legado de Dragon Ball")
                .excerpt("Autor fala sobre o futuro da franquia")
                .category(NewsCategory.ENTREVISTAS)
                .tags(List.of("dragon-ball", "entrevista"))
                .readTime(10)
                .isExclusive(true)
                .build());
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todas as notícias ordenadas por data")
        void deveRetornarTodasAsNoticias() {
            var result = newsRepository.findAll();

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando não há notícias")
        void deveRetornarListaVaziaQuandoNaoHaNoticias() {
            mongoRepository.deleteAll();

            assertThat(newsRepository.findAll()).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar paginado")
        void deveRetornarPaginado() {
            var page = newsRepository.findAll(PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar notícia pelo ID")
        void deveRetornarNoticiaPeloId() {
            var result = newsRepository.findById(news1.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getTitle()).isEqualTo("Novo capítulo de One Piece revelado");
            assertThat(result.get().getCategory()).isEqualTo(NewsCategory.LANCAMENTOS);
            assertThat(result.get().isFeatured()).isTrue();
            assertThat(result.get().getAuthor().getName()).isEqualTo("Editor");
            assertThat(result.get().getReactions().getLike()).isEqualTo(50);
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(newsRepository.findById("nonexistent")).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByCategory")
    class FindByCategory {

        @Test
        @DisplayName("Deve retornar notícias por categoria")
        void deveRetornarNoticiasPorCategoria() {
            var result = newsRepository.findByCategory(NewsCategory.LANCAMENTOS);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).contains("One Piece");
        }

        @Test
        @DisplayName("Deve retornar lista vazia para categoria sem notícias")
        void deveRetornarListaVaziaParaCategoriaSemNoticias() {
            assertThat(newsRepository.findByCategory(NewsCategory.EVENTOS)).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar paginado por categoria")
        void deveRetornarPaginadoPorCategoria() {
            var page = newsRepository.findByCategory(NewsCategory.LANCAMENTOS, PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("searchByTitle")
    class SearchByTitle {

        @Test
        @DisplayName("Deve buscar notícias por título (case insensitive)")
        void deveBuscarPorTituloCaseInsensitive() {
            var result = newsRepository.searchByTitle("chainsaw");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCategory()).isEqualTo(NewsCategory.ADAPTACOES);
        }

        @Test
        @DisplayName("Deve retornar lista vazia para busca sem resultados")
        void deveRetornarListaVaziaParaBuscaSemResultados() {
            assertThat(newsRepository.searchByTitle("inexistente")).isEmpty();
        }

        @Test
        @DisplayName("Deve buscar paginado por título")
        void deveBuscarPaginadoPorTitulo() {
            var page = newsRepository.searchByTitle("anime", PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir nova notícia")
        void devePersistirNovaNoticia() {
            var newNews = newsRepository.save(NewsItem.builder()
                    .title("Nova notícia de teste")
                    .category(NewsCategory.CURIOSIDADES)
                    .build());

            assertThat(newNews.getId()).isNotNull();
            assertThat(newsRepository.findAll()).hasSize(4);
        }

        @Test
        @DisplayName("Deve atualizar notícia existente")
        void deveAtualizarNoticiaExistente() {
            news1.setViews(2000);
            news1.setTitle("Título atualizado");
            newsRepository.save(news1);

            var updated = newsRepository.findById(news1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getViews()).isEqualTo(2000);
            assertThat(updated.get().getTitle()).isEqualTo("Título atualizado");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover notícia pelo ID")
        void deveRemoverNoticiaPeloId() {
            newsRepository.deleteById(news1.getId());

            assertThat(newsRepository.findById(news1.getId())).isEmpty();
            assertThat(newsRepository.findAll()).hasSize(2);
        }
    }
}

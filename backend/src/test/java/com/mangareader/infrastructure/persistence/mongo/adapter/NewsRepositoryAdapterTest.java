package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({NewsRepositoryAdapter.class, MongoTestContainerConfig.class})
@DisplayName("NewsRepositoryAdapter — Integração MongoDB")
class NewsRepositoryAdapterTest {

    @Autowired
    private NewsRepositoryPort newsRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private NewsItem news1;
    private NewsItem news2;
    private NewsItem news3;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(NewsItem.class);

        news1 = mongoTemplate.save(NewsItem.builder()
                .title("Novo capitulo de Naruto")
                .subtitle("Lancamento surpresa")
                .excerpt("O mangaka anunciou...")
                .category(NewsCategory.LANCAMENTOS)
                .tags(List.of("naruto", "manga"))
                .author(NewsAuthor.builder()
                        .id("author-1")
                        .name("Editor Ruan")
                        .role("Editor")
                        .build())
                .reactions(NewsReaction.builder()
                        .like(10)
                        .excited(5)
                        .build())
                .publishedAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .readTime(3)
                .views(100)
                .build());

        news2 = mongoTemplate.save(NewsItem.builder()
                .title("Adaptacao anime de One Piece")
                .subtitle("Netflix confirma")
                .category(NewsCategory.ADAPTACOES)
                .tags(List.of("one-piece", "anime"))
                .publishedAt(LocalDateTime.of(2024, 2, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2024, 2, 1, 10, 0))
                .readTime(5)
                .build());

        news3 = mongoTemplate.save(NewsItem.builder()
                .title("Evento manga expo 2024")
                .subtitle("Tudo sobre o evento")
                .category(NewsCategory.EVENTOS)
                .tags(List.of("evento", "expo"))
                .publishedAt(LocalDateTime.of(2024, 3, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2024, 3, 1, 10, 0))
                .readTime(7)
                .build());
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todas as notícias ordenadas por publishedAt DESC")
        void deveRetornarNoticiasOrdenadasDesc() {
            var result = newsRepository.findAll();
            assertThat(result).hasSize(3);
            assertThat(result.get(0).getTitle()).isEqualTo("Evento manga expo 2024");
            assertThat(result.get(2).getTitle()).isEqualTo("Novo capitulo de Naruto");
        }

        @Test
        @DisplayName("Deve retornar página de notícias")
        void deveRetornarPaginaDeNoticias() {
            var page = newsRepository.findAll(PageRequest.of(0, 2));
            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar notícia quando ID existe")
        void deveRetornarNoticiaQuandoIdExiste() {
            var result = newsRepository.findById(news1.getId());
            assertThat(result).isPresent();
            assertThat(result.get().getTitle()).isEqualTo("Novo capitulo de Naruto");
        }

        @Test
        @DisplayName("Deve retornar empty quando ID não existe")
        void deveRetornarEmptyQuandoIdNaoExiste() {
            var result = newsRepository.findById("id-inexistente");
            assertThat(result).isEmpty();
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
            assertThat(result.get(0).getTitle()).isEqualTo("Novo capitulo de Naruto");
        }

        @Test
        @DisplayName("Deve retornar página de notícias por categoria")
        void deveRetornarPaginaPorCategoria() {
            var page = newsRepository.findByCategory(NewsCategory.ADAPTACOES, PageRequest.of(0, 10));
            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Deve retornar vazio para categoria sem notícias")
        void deveRetornarVazioParaCategoriaSemNoticias() {
            var result = newsRepository.findByCategory(NewsCategory.ENTREVISTAS);
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("searchByTitle")
    class SearchByTitle {

        @Test
        @DisplayName("Deve buscar por título case-insensitive")
        void deveBuscarPorTituloCaseInsensitive() {
            var result = newsRepository.searchByTitle("naruto");
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).isEqualTo("Novo capitulo de Naruto");
        }

        @Test
        @DisplayName("Deve buscar por título parcial paginado")
        void deveBuscarPorTituloParcialPaginado() {
            var page = newsRepository.searchByTitle("anime", PageRequest.of(0, 10));
            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getTitle()).isEqualTo("Adaptacao anime de One Piece");
        }

        @Test
        @DisplayName("Deve retornar vazio para título inexistente")
        void deveRetornarVazioParaTituloInexistente() {
            var result = newsRepository.searchByTitle("Dragon Ball");
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir nova notícia com objetos embedded")
        void devePersistirNovaNoticiaComEmbedded() {
            var newNews = NewsItem.builder()
                    .title("Nova noticia teste")
                    .category(NewsCategory.CURIOSIDADES)
                    .author(NewsAuthor.builder()
                            .id("author-2")
                            .name("Editor Maria")
                            .role("Jornalista")
                            .build())
                    .reactions(NewsReaction.builder()
                            .like(0)
                            .excited(0)
                            .sad(0)
                            .surprised(0)
                            .build())
                    .publishedAt(LocalDateTime.now())
                    .build();

            var saved = newsRepository.save(newNews);

            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getAuthor().getName()).isEqualTo("Editor Maria");
            assertThat(saved.getReactions().getLike()).isZero();
        }

        @Test
        @DisplayName("Deve atualizar notícia existente")
        void deveAtualizarNoticiaExistente() {
            news1.setViews(500);
            newsRepository.save(news1);

            var updated = newsRepository.findById(news1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getViews()).isEqualTo(500);
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover a notícia")
        void deveRemoverNoticia() {
            newsRepository.deleteById(news3.getId());
            assertThat(newsRepository.findById(news3.getId())).isEmpty();
            assertThat(newsRepository.findAll()).hasSize(2);
        }
    }
}

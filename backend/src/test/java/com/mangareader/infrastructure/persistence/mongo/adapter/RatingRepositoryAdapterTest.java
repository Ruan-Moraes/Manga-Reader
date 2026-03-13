package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

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

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.infrastructure.persistence.mongo.repository.RatingMongoRepository;

@DataMongoTest
@Testcontainers
@ActiveProfiles("test")
@Import(RatingRepositoryAdapter.class)
@DisplayName("RatingRepositoryAdapter — Integração MongoDB")
class RatingRepositoryAdapterTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private RatingRepositoryPort ratingRepository;

    @Autowired
    private RatingMongoRepository mongoRepository;

    private MangaRating rating1;
    private MangaRating rating2;
    private MangaRating rating3;

    @BeforeEach
    void setUp() {
        mongoRepository.deleteAll();

        rating1 = mongoRepository.save(MangaRating.builder()
                .titleId("title-1")
                .userId("user-1")
                .userName("Ruan")
                .stars(4.5)
                .comment("Excelente mangá!")
                .categoryRatings(Map.of("art", 5.0, "storyline", 4.0, "fun", 4.5))
                .build());

        rating2 = mongoRepository.save(MangaRating.builder()
                .titleId("title-1")
                .userId("user-2")
                .userName("Maria")
                .stars(3.5)
                .comment("Bom, mas poderia ser melhor")
                .build());

        rating3 = mongoRepository.save(MangaRating.builder()
                .titleId("title-2")
                .userId("user-1")
                .userName("Ruan")
                .stars(5.0)
                .comment("Obra-prima!")
                .build());
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {

        @Test
        @DisplayName("Deve retornar todas as avaliações de um título")
        void deveRetornarAvaliacoesDoTitulo() {
            var result = ratingRepository.findByTitleId("title-1");

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Deve retornar lista vazia para título sem avaliações")
        void deveRetornarListaVaziaParaTituloSemAvaliacoes() {
            assertThat(ratingRepository.findByTitleId("nonexistent")).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar paginado por título")
        void deveRetornarPaginadoPorTitulo() {
            var page = ratingRepository.findByTitleId("title-1", PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("findByTitleIdAndUserId")
    class FindByTitleIdAndUserId {

        @Test
        @DisplayName("Deve retornar avaliação específica de um usuário para um título")
        void deveRetornarAvaliacaoEspecifica() {
            var result = ratingRepository.findByTitleIdAndUserId("title-1", "user-1");

            assertThat(result).isPresent();
            assertThat(result.get().getStars()).isEqualTo(4.5);
            assertThat(result.get().getCategoryRatings()).containsEntry("art", 5.0);
        }

        @Test
        @DisplayName("Deve retornar empty quando usuário não avaliou o título")
        void deveRetornarEmptyQuandoUsuarioNaoAvaliou() {
            assertThat(ratingRepository.findByTitleIdAndUserId("title-2", "user-2")).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByUserId")
    class FindByUserId {

        @Test
        @DisplayName("Deve retornar todas as avaliações de um usuário")
        void deveRetornarAvaliacoesDoUsuario() {
            var result = ratingRepository.findByUserId("user-1");

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Deve retornar paginado por usuário")
        void deveRetornarPaginadoPorUsuario() {
            var page = ratingRepository.findByUserId("user-1", PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar avaliação pelo ID")
        void deveRetornarAvaliacaoPeloId() {
            var result = ratingRepository.findById(rating1.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getUserName()).isEqualTo("Ruan");
            assertThat(result.get().getStars()).isEqualTo(4.5);
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(ratingRepository.findById("nonexistent")).isEmpty();
        }
    }

    @Nested
    @DisplayName("countByTitleId")
    class CountByTitleId {

        @Test
        @DisplayName("Deve retornar contagem de avaliações de um título")
        void deveRetornarContagemDeAvaliacoes() {
            assertThat(ratingRepository.countByTitleId("title-1")).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar zero para título sem avaliações")
        void deveRetornarZeroParaTituloSemAvaliacoes() {
            assertThat(ratingRepository.countByTitleId("nonexistent")).isZero();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir nova avaliação")
        void devePersistirNovaAvaliacao() {
            var newRating = ratingRepository.save(MangaRating.builder()
                    .titleId("title-3")
                    .userId("user-3")
                    .userName("Pedro")
                    .stars(4.0)
                    .build());

            assertThat(newRating.getId()).isNotNull();
            assertThat(ratingRepository.findById(newRating.getId())).isPresent();
        }

        @Test
        @DisplayName("Deve atualizar avaliação existente")
        void deveAtualizarAvaliacaoExistente() {
            rating1.setStars(5.0);
            rating1.setComment("Mudei de opinião, é perfeito!");
            ratingRepository.save(rating1);

            var updated = ratingRepository.findById(rating1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getStars()).isEqualTo(5.0);
            assertThat(updated.get().getComment()).isEqualTo("Mudei de opinião, é perfeito!");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover avaliação pelo ID")
        void deveRemoverAvaliacaoPeloId() {
            ratingRepository.deleteById(rating1.getId());

            assertThat(ratingRepository.findById(rating1.getId())).isEmpty();
            assertThat(ratingRepository.findByTitleId("title-1")).hasSize(1);
        }
    }
}

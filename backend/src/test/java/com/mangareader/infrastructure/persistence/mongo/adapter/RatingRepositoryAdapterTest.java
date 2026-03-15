package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({RatingRepositoryAdapter.class, MongoTestContainerConfig.class})
@DisplayName("RatingRepositoryAdapter — Integração MongoDB")
class RatingRepositoryAdapterTest {

    @Autowired
    private RatingRepositoryPort ratingRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private MangaRating rating1;
    private MangaRating rating2;
    private MangaRating rating3;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(MangaRating.class);

        // Recriar indexes (incluindo o CompoundIndex unique) após drop
        IndexOperations indexOps = mongoTemplate.indexOps(MangaRating.class);
        IndexResolver resolver = new MongoPersistentEntityIndexResolver(
                mongoTemplate.getConverter().getMappingContext());
        resolver.resolveIndexFor(MangaRating.class).forEach(indexOps::ensureIndex);

        rating1 = mongoTemplate.save(MangaRating.builder()
                .titleId("title-1")
                .userId("user-1")
                .userName("Ruan")
                .funRating(4.0)
                .artRating(5.0)
                .storylineRating(4.0)
                .charactersRating(4.5)
                .originalityRating(4.0)
                .pacingRating(4.5)
                .overallRating(4.3)
                .comment("Muito bom")
                .createdAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .build());

        rating2 = mongoTemplate.save(MangaRating.builder()
                .titleId("title-1")
                .userId("user-2")
                .userName("Maria")
                .funRating(3.0)
                .artRating(3.0)
                .storylineRating(3.0)
                .charactersRating(3.0)
                .originalityRating(3.0)
                .pacingRating(3.0)
                .overallRating(3.0)
                .comment("Razoavel")
                .createdAt(LocalDateTime.of(2024, 1, 2, 10, 0))
                .build());

        rating3 = mongoTemplate.save(MangaRating.builder()
                .titleId("title-2")
                .userId("user-1")
                .userName("Ruan")
                .funRating(5.0)
                .artRating(5.0)
                .storylineRating(5.0)
                .charactersRating(5.0)
                .originalityRating(5.0)
                .pacingRating(5.0)
                .overallRating(5.0)
                .comment("Obra prima")
                .createdAt(LocalDateTime.of(2024, 1, 3, 10, 0))
                .build());
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {

        @Test
        @DisplayName("Deve retornar ratings do título")
        void deveRetornarRatingsDoTitulo() {
            var result = ratingRepository.findByTitleId("title-1");
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Deve retornar página de ratings do título")
        void deveRetornarPaginaDeRatings() {
            var page = ratingRepository.findByTitleId("title-1", PageRequest.of(0, 1));
            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("findByTitleIdAndUserId")
    class FindByTitleIdAndUserId {

        @Test
        @DisplayName("Deve retornar rating de um usuário para um título")
        void deveRetornarRatingDeUsuarioParaTitulo() {
            var result = ratingRepository.findByTitleIdAndUserId("title-1", "user-1");
            assertThat(result).isPresent();
            assertThat(result.get().getOverallRating()).isEqualTo(4.3);
        }

        @Test
        @DisplayName("Deve retornar empty para combinação inexistente")
        void deveRetornarEmptyParaCombinacaoInexistente() {
            var result = ratingRepository.findByTitleIdAndUserId("title-2", "user-2");
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar rating quando ID existe")
        void deveRetornarRatingQuandoIdExiste() {
            var result = ratingRepository.findById(rating1.getId());
            assertThat(result).isPresent();
            assertThat(result.get().getUserName()).isEqualTo("Ruan");
        }

        @Test
        @DisplayName("Deve retornar empty quando ID não existe")
        void deveRetornarEmptyQuandoIdNaoExiste() {
            var result = ratingRepository.findById("id-inexistente");
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByUserId")
    class FindByUserId {

        @Test
        @DisplayName("Deve retornar ratings do usuário")
        void deveRetornarRatingsDoUsuario() {
            var result = ratingRepository.findByUserId("user-1");
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Deve retornar página de ratings do usuário")
        void deveRetornarPaginaDeRatingsDoUsuario() {
            var page = ratingRepository.findByUserId("user-1", PageRequest.of(0, 1));
            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("countByTitleId")
    class CountByTitleId {

        @Test
        @DisplayName("Deve retornar contagem correta")
        void deveRetornarContagemCorreta() {
            assertThat(ratingRepository.countByTitleId("title-1")).isEqualTo(2);
            assertThat(ratingRepository.countByTitleId("title-2")).isEqualTo(1);
            assertThat(ratingRepository.countByTitleId("title-inexistente")).isZero();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo rating e gerar ID")
        void devePersistirNovoRating() {
            var newRating = MangaRating.builder()
                    .titleId("title-3")
                    .userId("user-3")
                    .userName("Carlos")
                    .funRating(4.0)
                    .artRating(4.0)
                    .storylineRating(4.0)
                    .charactersRating(4.0)
                    .originalityRating(4.0)
                    .pacingRating(4.0)
                    .overallRating(4.0)
                    .createdAt(LocalDateTime.now())
                    .build();

            var saved = ratingRepository.save(newRating);

            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getOverallRating()).isEqualTo(4.0);
        }

        @Test
        @DisplayName("Deve atualizar rating existente")
        void deveAtualizarRatingExistente() {
            rating1.setFunRating(5.0);
            rating1.setOverallRating(rating1.calculateOverallRating());
            ratingRepository.save(rating1);

            var updated = ratingRepository.findById(rating1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getFunRating()).isEqualTo(5.0);
        }

        @Test
        @DisplayName("Deve lançar exceção ao duplicar titleId+userId")
        void deveLancarExcecaoAoDuplicarTitleIdUserId() {
            var duplicate = MangaRating.builder()
                    .titleId("title-1")
                    .userId("user-1")
                    .userName("Ruan Duplicado")
                    .overallRating(1.0)
                    .createdAt(LocalDateTime.now())
                    .build();

            assertThatThrownBy(() -> ratingRepository.save(duplicate))
                    .isInstanceOf(DuplicateKeyException.class);
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover o rating")
        void deveRemoverRating() {
            ratingRepository.deleteById(rating3.getId());
            assertThat(ratingRepository.findById(rating3.getId())).isEmpty();
            assertThat(ratingRepository.countByTitleId("title-2")).isZero();
        }
    }
}

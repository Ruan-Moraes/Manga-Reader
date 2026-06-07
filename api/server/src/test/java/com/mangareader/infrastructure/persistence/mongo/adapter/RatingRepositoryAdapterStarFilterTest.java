package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mangareader.infrastructure.persistence.mongo.repository.RatingMongoRepository;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("RatingRepositoryAdapter — filtro por estrela (DT-47)")
@Tag("testcontainers")
class RatingRepositoryAdapterStarFilterTest {
    @Autowired
    private RatingMongoRepository mongoRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private RatingRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(MangaRating.class);
        adapter = new RatingRepositoryAdapter(mongoRepository, mongoTemplate);

        save("t1", "u1", 5.0);  // estrela 5
        save("t1", "u2", 4.6);  // round → 5
        save("t1", "u3", 4.4);  // round → 4
        save("t1", "u4", 3.5);  // round → 4 (half-up: [3.5,4.5) ⇒ 4)
        save("t1", "u5", 1.0);  // estrela 1
        save("t2", "u6", 5.0);  // outro título
    }

    private void save(String titleId, String userId, double overall) {
        adapter.save(MangaRating.builder()
                .titleId(titleId).userId(userId).userName(userId).overallRating(overall).build());
    }

    @Test
    @DisplayName("star=5 retorna apenas overallRating em [4.5, 5.5)")
    void deveFiltrarEstrela5() {
        var page = adapter.findByTitleId("t1", 5, PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).allSatisfy(r -> assertThat(r.getOverallRating()).isGreaterThanOrEqualTo(4.5));
    }

    @Test
    @DisplayName("star=4 retorna overallRating em [3.5, 4.5)")
    void deveFiltrarEstrela4() {
        var page = adapter.findByTitleId("t1", 4, PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("star nulo retorna todas as avaliações do título")
    void deveRetornarTodasSemFiltro() {
        var page = adapter.findByTitleId("t1", null, PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(5);
    }

    @Test
    @DisplayName("filtro respeita o título (não vaza t2)")
    void deveRespeitarTitulo() {
        var page = adapter.findByTitleId("t2", 5, PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(1);
    }
}

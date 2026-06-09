package com.mangareader.aggregator.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.mangareader.aggregator.application.RecalculateTitleRatingUseCase;
import com.mangareader.aggregator.domain.TitleRatingAggregate;
import com.mangareader.aggregator.infrastructure.migration.V001CreateTitleRatingAggregate;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao.RatingStats;
import com.mangareader.aggregator.infrastructure.repository.TitleRatingAggregateRepository;

/**
 * Integração Mongo (TestContainers) do agregado: DAO de leitura sobre
 * {@code ratings}, backfill do Mongock e recompute end-to-end.
 */
@DataMongoTest
@Import({RatingAggregationDao.class})
@Testcontainers
@Tag("testcontainers")
@DisplayName("TitleRatingAggregate — Mongo IT")
class TitleRatingAggregateMongoTest {
    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void mongoProps(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

    @Autowired private MongoTemplate mongoTemplate;
    @Autowired private RatingAggregationDao ratingAggregationDao;
    @Autowired private TitleRatingAggregateRepository aggregateRepository;

    @BeforeEach
    void setUp() {
        mongoTemplate.getCollection("ratings").drop();
        aggregateRepository.deleteAll();

        // t1: notas 5,4,3 → média 4.0, dist star5=1,star4=1,star3=1
        insertRating("t1", 5.0);
        insertRating("t1", 4.0);
        insertRating("t1", 3.0);
        // t2: nota única 2.0
        insertRating("t2", 2.0);
    }

    private void insertRating(String titleId, double overallRating) {
        mongoTemplate.getCollection("ratings").insertOne(
                new Document("titleId", titleId).append("overallRating", overallRating));
    }

    @Test
    @DisplayName("DAO agrega média, contagem e distribuição corretamente")
    void daoAgrega() {
        RatingStats t1 = ratingAggregationDao.aggregate("t1");

        assertThat(t1.count()).isEqualTo(3);
        assertThat(t1.average()).isEqualTo(4.0);
        assertThat(t1.star5()).isEqualTo(1);
        assertThat(t1.star4()).isEqualTo(1);
        assertThat(t1.star3()).isEqualTo(1);

        assertThat(ratingAggregationDao.distinctRatedTitleIds())
                .containsExactlyInAnyOrder("t1", "t2");
    }

    @Test
    @DisplayName("Backfill V001 cria agregados para todos os títulos avaliados")
    void backfillCriaAgregados() {
        new V001CreateTitleRatingAggregate(mongoTemplate).execute();

        TitleRatingAggregate t1 = aggregateRepository.findById("t1").orElseThrow();
        assertThat(t1.getRatingAverage()).isEqualTo(4.0);
        assertThat(t1.getTotalRatings()).isEqualTo(3);

        TitleRatingAggregate t2 = aggregateRepository.findById("t2").orElseThrow();
        assertThat(t2.getRatingAverage()).isEqualTo(2.0);
        assertThat(t2.getTotalRatings()).isEqualTo(1);
    }

    @Test
    @DisplayName("Recompute persiste e atualiza o agregado de um título")
    void recomputePersiste() {
        var useCase = new RecalculateTitleRatingUseCase(ratingAggregationDao, aggregateRepository);

        useCase.execute("t1");

        TitleRatingAggregate t1 = aggregateRepository.findById("t1").orElseThrow();
        assertThat(t1.getTotalRatings()).isEqualTo(3);

        // Nova avaliação → recompute reflete contagem atualizada.
        insertRating("t1", 1.0);
        useCase.execute("t1");

        assertThat(aggregateRepository.findById("t1").orElseThrow().getTotalRatings()).isEqualTo(4);
    }
}

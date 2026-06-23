package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({TitleRatingAggregateReadAdapter.class, MongoTestContainerConfig.class})
@DisplayName("TitleRatingAggregateReadAdapter — Integração MongoDB")
@Tag("testcontainers")
class TitleRatingAggregateReadAdapterTest {
    private static final String COLLECTION = "reviews_aggregate";

    @Autowired
    private TitleRatingAggregateReadPort readPort;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void setUp() {
        mongoTemplate.getCollection(COLLECTION).drop();

        mongoTemplate.getCollection(COLLECTION).insertMany(List.of(
                aggregateDoc("t1", 4.3, 7, 0, 1, 1, 2, 3),
                aggregateDoc("t2", 2.0, 1, 0, 1, 0, 0, 0)));
    }

    private Document aggregateDoc(String titleId, double avg, long total,
                                  long s1, long s2, long s3, long s4, long s5) {
        return new Document("_id", titleId)
                .append("ratingAverage", avg)
                .append("totalRatings", total)
                .append("star1", s1).append("star2", s2).append("star3", s3)
                .append("star4", s4).append("star5", s5);
    }

    @Test
    @DisplayName("findByTitleId mapeia o agregado")
    void findByTitleId() {
        TitleRatingAggregateView view = readPort.findByTitleId("t1").orElseThrow();

        assertThat(view.titleId()).isEqualTo("t1");
        assertThat(view.ratingAverage()).isEqualTo(4.3);
        assertThat(view.totalRatings()).isEqualTo(7);
        assertThat(view.star5()).isEqualTo(3);
    }

    @Test
    @DisplayName("findByTitleId vazio quando não há agregado")
    void findByTitleIdAusente() {
        assertThat(readPort.findByTitleId("desconhecido")).isEmpty();
    }

    @Test
    @DisplayName("findByTitleIdIn busca em lote e indexa por titleId")
    void findByTitleIdIn() {
        var map = readPort.findByTitleIdIn(List.of("t1", "t2", "ausente"));

        assertThat(map).hasSize(2).containsKeys("t1", "t2");
        assertThat(map.get("t2").ratingAverage()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("findByTitleIdIn vazio retorna mapa vazio")
    void findByTitleIdInVazio() {
        assertThat(readPort.findByTitleIdIn(List.of())).isEmpty();
    }

    @Test
    @DisplayName("findTop ordena por ratingAverage desc e respeita o limite")
    void findTopOrdenaERespeitaLimite() {
        var top1 = readPort.findTop(1);
        assertThat(top1).extracting(TitleRatingAggregateView::titleId).containsExactly("t1");

        var top5 = readPort.findTop(5);
        assertThat(top5).extracting(TitleRatingAggregateView::titleId).containsExactly("t1", "t2");
        assertThat(top5.get(0).ratingAverage()).isEqualTo(4.3);
    }

    @Test
    @DisplayName("findTop com limite <= 0 retorna lista vazia")
    void findTopLimiteZero() {
        assertThat(readPort.findTop(0)).isEmpty();
    }
}

package com.mangareader.trending.infrastructure.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.StreamSupport;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;

import com.mangareader.testing.mongo.Mongo8TestContainerFactory;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:trending-migration;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "trending.seed.enabled=false",
        "spring.task.scheduling.enabled=false",
        "trending.retention-days=90"
})
class TrendingMigrationStartupTest {
    private static final MongoDBContainer MONGO = Mongo8TestContainerFactory.create();

    static { MONGO.start(); }

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", MONGO::getReplicaSetUrl);
    }

    @Autowired MongoTemplate mongo;

    @Test
    void mongockRegistersChangeUnitsAndCreatesRankingSignalAndTtlIndexes() {
        var collections = mongo.getCollectionNames();
        assertThat(collections).anyMatch(name -> name.toLowerCase().contains("mongock") && name.toLowerCase().contains("change"));

        var indexes = StreamSupport.stream(mongo.getCollection("title_trend_daily").listIndexes().spliterator(), false).toList();
        assertThat(indexes).extracting(document -> document.getString("name"))
                .contains("idx_trend_day", "idx_trend_week", "idx_trend_month", "idx_trend_day_reads", "idx_trend_week_reviews", "idx_trend_month_libraryadds", "idx_trend_retention");

        Document ttl = indexes.stream().filter(index -> "idx_trend_retention".equals(index.getString("name"))).findFirst().orElseThrow();
        assertThat(((Number) ttl.get("expireAfterSeconds")).longValue()).isEqualTo(90L * 24 * 60 * 60);

        assertThat(indexNames("user_chapter_reads")).contains("idx_reads_time_title");
        assertThat(indexNames("reviews")).contains("idx_reviews_time_title");
        assertThat(indexNames("comments")).contains("idx_comments_type_time_target");
        assertThat(indexNames("chapters")).contains("idx_chapters_release_title");
    }

    private java.util.List<String> indexNames(String collection) {
        return StreamSupport.stream(mongo.getCollection(collection).listIndexes().spliterator(), false)
                .map(index -> index.getString("name")).toList();
    }
}

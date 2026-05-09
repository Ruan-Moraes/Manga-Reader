package com.mangareader.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("V005AddLanguageToUgc (Mongock)")
class V005AddLanguageToUgcTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void clean() {
        mongoTemplate.dropCollection("comments");
        mongoTemplate.dropCollection("ratings");
    }

    @Test
    @DisplayName("Backfill grava language=pt-BR em comments e ratings sem language")
    void backfillsDefaultLanguage() {
        mongoTemplate.getCollection("comments").insertOne(
                new Document("_id", "c1").append("textContent", "Top"));
        mongoTemplate.getCollection("ratings").insertOne(
                new Document("_id", "r1").append("comment", "Bom"));

        new V005AddLanguageToUgc(mongoTemplate).execute();

        Document c = mongoTemplate.getCollection("comments")
                .find(new Document("_id", "c1")).first();
        Document r = mongoTemplate.getCollection("ratings")
                .find(new Document("_id", "r1")).first();

        assertThat(c).isNotNull();
        assertThat(c.getString("language")).isEqualTo("pt-BR");
        assertThat(r).isNotNull();
        assertThat(r.getString("language")).isEqualTo("pt-BR");
    }

    @Test
    @DisplayName("Não sobrescreve language existente")
    void preservesExisting() {
        mongoTemplate.getCollection("comments").insertOne(
                new Document("_id", "c2")
                        .append("textContent", "Hi")
                        .append("language", "en-US"));

        new V005AddLanguageToUgc(mongoTemplate).execute();

        Document c = mongoTemplate.getCollection("comments")
                .find(new Document("_id", "c2")).first();
        assertThat(c).isNotNull();
        assertThat(c.getString("language")).isEqualTo("en-US");
    }

    @Test
    @DisplayName("Cria índice em language para comments e ratings")
    void createsLanguageIndex() {
        new V005AddLanguageToUgc(mongoTemplate).execute();

        var c = mongoTemplate.indexOps("comments").getIndexInfo().stream()
                .map(idx -> idx.getName()).toList();
        var r = mongoTemplate.indexOps("ratings").getIndexInfo().stream()
                .map(idx -> idx.getName()).toList();

        assertThat(c).contains("idx_comments_language");
        assertThat(r).contains("idx_ratings_language");
    }
}

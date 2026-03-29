package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.domain.errorlog.entity.ErrorLog;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mangareader.infrastructure.persistence.mongo.repository.ErrorLogMongoRepository;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("ErrorLogRepositoryAdapter")
class ErrorLogRepositoryAdapterTest {
    @Autowired
    private ErrorLogMongoRepository mongoRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private ErrorLogRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(ErrorLog.class);

        adapter = new ErrorLogRepositoryAdapter(mongoRepository);
    }

    @Test
    @DisplayName("Deve salvar e retornar error log com ID gerado")
    void deveSalvarERetornarErrorLog() {
        var errorLog = ErrorLog.builder()
                .message("TypeError: x is undefined")
                .stackTrace("TypeError: x is undefined\n    at Component.render")
                .source("error-boundary")
                .url("/Manga-Reader/titles/1")
                .userAgent("Mozilla/5.0")
                .userId("user-123")
                .build();

        ErrorLog saved = adapter.save(errorLog);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getMessage()).isEqualTo("TypeError: x is undefined");
        assertThat(saved.getStackTrace()).contains("at Component.render");
        assertThat(saved.getSource()).isEqualTo("error-boundary");
        assertThat(saved.getUrl()).isEqualTo("/Manga-Reader/titles/1");
        assertThat(saved.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(saved.getUserId()).isEqualTo("user-123");
    }

    @Test
    @DisplayName("Deve salvar error log com campos opcionais nulos")
    void deveSalvarComCamposOpcionaisNulos() {
        var errorLog = ErrorLog.builder()
                .message("Unhandled rejection")
                .source("unhandled-rejection")
                .build();

        ErrorLog saved = adapter.save(errorLog);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getMessage()).isEqualTo("Unhandled rejection");
        assertThat(saved.getStackTrace()).isNull();
        assertThat(saved.getUserId()).isNull();
    }

    @Test
    @DisplayName("Deve persistir no MongoDB e ser encontrado via template")
    void devePersistirNoMongoDB() {
        var errorLog = ErrorLog.builder()
                .message("Script error")
                .source("window-error")
                .build();

        ErrorLog saved = adapter.save(errorLog);

        ErrorLog found = mongoTemplate.findById(saved.getId(), ErrorLog.class);
        assertThat(found).isNotNull();
        assertThat(found.getMessage()).isEqualTo("Script error");
        assertThat(found.getSource()).isEqualTo("window-error");
    }
}

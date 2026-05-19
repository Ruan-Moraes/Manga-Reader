package com.mangareader;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

/**
 * Smoke test de carga do contexto Spring completo.
 * <p>
 * Sobe o ApplicationContext inteiro com H2 (JPA) e TestContainers (MongoDB).
 * Falha de wiring de qualquer bean reprova o teste.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("MangaReaderApplication — carga de contexto")
@Tag("testcontainers")
class MangaReaderApplicationTests {

    @Test
    @DisplayName("Deve carregar o contexto Spring completo")
    void contextLoads() {
    }
}

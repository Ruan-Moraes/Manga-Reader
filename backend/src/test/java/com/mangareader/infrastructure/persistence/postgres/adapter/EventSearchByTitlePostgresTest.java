package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.infrastructure.persistence.postgres.PostgresTestContainerConfig;
import com.mangareader.shared.domain.i18n.LocalizedString;

/**
 * Cobre {@code EventRepositoryAdapter.searchByTitle} contra Postgres real
 * (Testcontainers) — a query usa {@code jsonb_each_text}, não suportado por
 * H2 mesmo em MODE=PostgreSQL. Flyway cria o schema.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({PostgresTestContainerConfig.class, EventRepositoryAdapter.class})
@TestPropertySource(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
@DisplayName("EventRepositoryAdapter.searchByTitle — Postgres (jsonb)")
class EventSearchByTitlePostgresTest {

    @Autowired
    private EventRepositoryPort eventRepository;

    private Event event(String pt, String en) {
        return Event.builder()
                .title(LocalizedString.of(java.util.Map.of("pt-BR", pt, "en-US", en)))
                .subtitle(LocalizedString.empty())
                .description(LocalizedString.empty())
                .startDate(LocalDateTime.of(2026, 5, 1, 10, 0))
                .endDate(LocalDateTime.of(2026, 5, 2, 18, 0))
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.CONVENCAO)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    @BeforeEach
    void setUp() {
        eventRepository.save(event("Reino de Aço", "Kingdom of Steel"));
        eventRepository.save(event("Flores de Neon", "Neon Flowers"));
    }

    @Test
    @DisplayName("Encontra por substring em qualquer locale do título JSONB")
    void encontraPorLocale() {
        var ptMatch = eventRepository.searchByTitle("reino", PageRequest.of(0, 10));
        assertThat(ptMatch.getTotalElements()).isEqualTo(1);

        var enMatch = eventRepository.searchByTitle("flowers", PageRequest.of(0, 10));
        assertThat(enMatch.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Retorna vazio quando não há correspondência")
    void semCorrespondencia() {
        var none = eventRepository.searchByTitle("inexistente", PageRequest.of(0, 10));
        assertThat(none.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("Pagina o resultado")
    void pagina() {
        var page = eventRepository.searchByTitle("e", PageRequest.of(0, 1));
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getTotalElements()).isEqualTo(2);
    }
}

package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(EventRepositoryAdapter.class)
@DisplayName("EventRepositoryAdapter — Integração JPA")
class EventRepositoryAdapterTest {

    @Autowired
    private EventRepositoryPort eventRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Event eventHappening;
    private Event eventEnded;

    private Event buildEvent(String title, EventStatus status, LocalDateTime start) {
        return Event.builder()
                .title(title)
                .startDate(start)
                .endDate(start.plusDays(2))
                .timeline(EventTimeline.UPCOMING)
                .status(status)
                .type(EventType.CONVENCAO)
                .build();
    }

    @BeforeEach
    void setUp() {
        eventHappening = entityManager.persistAndFlush(
                buildEvent("Anime Expo", EventStatus.HAPPENING_NOW, LocalDateTime.of(2026, 7, 1, 10, 0))
        );
        eventEnded = entityManager.persistAndFlush(
                buildEvent("Manga Fest", EventStatus.ENDED, LocalDateTime.of(2026, 3, 1, 9, 0))
        );
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todos os eventos ordenados por startDate DESC")
        void deveRetornarTodosEventosOrdenados() {
            var events = eventRepository.findAll();

            assertThat(events).hasSize(2);
            assertThat(events.get(0).getTitle()).isEqualTo("Anime Expo");
            assertThat(events.get(1).getTitle()).isEqualTo("Manga Fest");
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar evento pelo ID")
        void deveRetornarEventoPeloId() {
            var result = eventRepository.findById(eventHappening.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getTitle()).isEqualTo("Anime Expo");
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(eventRepository.findById(UUID.randomUUID())).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByStatus")
    class FindByStatus {

        @Test
        @DisplayName("Deve filtrar eventos por status")
        void deveFiltrarPorStatus() {
            var result = eventRepository.findByStatus(EventStatus.HAPPENING_NOW);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).isEqualTo("Anime Expo");
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nenhum evento com o status")
        void deveRetornarVazioQuandoNenhumEvento() {
            var result = eventRepository.findByStatus(EventStatus.COMING_SOON);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Deve filtrar por status com paginação")
        void deveFiltrarPorStatusComPaginacao() {
            var page = eventRepository.findByStatus(EventStatus.ENDED, PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getTitle()).isEqualTo("Manga Fest");
        }
    }

    @Nested
    @DisplayName("findAll paginado")
    class FindAllPaginated {

        @Test
        @DisplayName("Deve retornar página com tamanho correto")
        void deveRetornarPaginaCorreta() {
            var page = eventRepository.findAll(PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo evento e gerar UUID")
        void devePersistirNovoEvento() {
            var newEvent = buildEvent("Comic Con", EventStatus.COMING_SOON, LocalDateTime.of(2026, 12, 1, 10, 0));

            var persisted = eventRepository.save(newEvent);

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getTitle()).isEqualTo("Comic Con");
            assertThat(persisted.getStatus()).isEqualTo(EventStatus.COMING_SOON);
        }

        @Test
        @DisplayName("Deve atualizar evento existente")
        void deveAtualizarEvento() {
            eventHappening.setTitle("Anime Expo 2026");
            var updated = eventRepository.save(eventHappening);
            entityManager.flush();

            assertThat(updated.getTitle()).isEqualTo("Anime Expo 2026");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover evento pelo ID")
        void deveRemoverEvento() {
            eventRepository.deleteById(eventEnded.getId());
            entityManager.flush();

            assertThat(eventRepository.findById(eventEnded.getId())).isEmpty();
        }
    }
}

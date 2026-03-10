package com.mangareader.presentation.event.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.event.usecase.GetEventByIdUseCase;
import com.mangareader.application.event.usecase.GetEventsByStatusUseCase;
import com.mangareader.application.event.usecase.GetEventsUseCase;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.shared.exception.ResourceNotFoundException;

@WebMvcTest(EventController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("EventController")
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetEventsUseCase getEventsUseCase;

    @MockitoBean
    private GetEventByIdUseCase getEventByIdUseCase;

    @MockitoBean
    private GetEventsByStatusUseCase getEventsByStatusUseCase;

    private Event buildEvent() {
        return Event.builder()
                .id(UUID.randomUUID())
                .title("Anime Friends 2026")
                .status(EventStatus.COMING_SOON)
                .timeline(EventTimeline.UPCOMING)
                .type(EventType.CONVENCAO)
                .startDate(LocalDateTime.of(2026, 7, 10, 10, 0))
                .endDate(LocalDateTime.of(2026, 7, 13, 22, 0))
                .participants(500)
                .interested(2000)
                .build();
    }

    @Nested
    @DisplayName("GET /api/events")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com eventos paginados")
        void deveRetornar200ComEventos() throws Exception {
            when(getEventsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(buildEvent())));

            mockMvc.perform(get("/api/events"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1))
                    .andExpect(jsonPath("$.data.content[0].title").value("Anime Friends 2026"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getEventsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/events"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/events/{id}")
    class GetById {

        @Test
        @DisplayName("Deve retornar 200 com evento encontrado")
        void deveRetornar200() throws Exception {
            UUID eventId = UUID.randomUUID();
            var event = Event.builder()
                    .id(eventId).title("CCXP 2026")
                    .status(EventStatus.REGISTRATIONS_OPEN)
                    .timeline(EventTimeline.UPCOMING).type(EventType.CONVENCAO)
                    .startDate(LocalDateTime.of(2026, 12, 5, 10, 0))
                    .endDate(LocalDateTime.of(2026, 12, 8, 22, 0))
                    .build();
            when(getEventByIdUseCase.execute(eventId)).thenReturn(event);

            mockMvc.perform(get("/api/events/" + eventId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("CCXP 2026"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando evento não existe")
        void deveRetornar404() throws Exception {
            UUID eventId = UUID.randomUUID();
            when(getEventByIdUseCase.execute(eventId))
                    .thenThrow(new ResourceNotFoundException("Event", "id", eventId));

            mockMvc.perform(get("/api/events/" + eventId))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/events/status/{status}")
    class GetByStatus {

        @Test
        @DisplayName("Deve retornar 200 com eventos filtrados por status")
        void deveRetornar200FiltradoPorStatus() throws Exception {
            when(getEventsByStatusUseCase.execute(eq(EventStatus.HAPPENING_NOW), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(buildEvent())));

            mockMvc.perform(get("/api/events/status/HAPPENING_NOW"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar página vazia para status sem eventos")
        void deveRetornarPaginaVazia() throws Exception {
            when(getEventsByStatusUseCase.execute(eq(EventStatus.ENDED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/events/status/ENDED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }
}

package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.event.usecase.admin.CreateEventUseCase;
import com.mangareader.application.event.usecase.admin.DeleteEventUseCase;
import com.mangareader.application.event.usecase.admin.UpdateEventUseCase;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

@WebMvcTest(AdminEventController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminEventController")
class AdminEventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private EventRepositoryPort eventRepository;

    @MockitoBean
    private CreateEventUseCase createEventUseCase;

    @MockitoBean
    private UpdateEventUseCase updateEventUseCase;

    @MockitoBean
    private DeleteEventUseCase deleteEventUseCase;

    private final UUID EVENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private Event buildEvent() {
        return Event.builder()
                .id(EVENT_ID)
                .title("Anime Expo")
                .subtitle("Subtitle")
                .description("Description")
                .image("image.jpg")
                .startDate(LocalDateTime.of(2026, 5, 1, 10, 0))
                .endDate(LocalDateTime.of(2026, 5, 3, 18, 0))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.CONVENCAO)
                .location(EventLocation.builder().label("Centro").city("SP").isOnline(false).build())
                .organizer(EventOrganizer.builder().organizerName("MangaCon").build())
                .priceLabel("R$ 50")
                .participants(200)
                .interested(500)
                .isFeatured(true)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/events — deve retornar 200 com lista paginada")
    void deveRetornar200ComListaPaginada() throws Exception {
        var page = new PageImpl<>(List.of(buildEvent()));
        when(eventRepository.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Anime Expo"));
    }

    @Test
    @DisplayName("GET /api/admin/events/{id} — deve retornar 200 com detalhes")
    void deveRetornar200ComDetalhes() throws Exception {
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(buildEvent()));

        mockMvc.perform(get("/api/admin/events/" + EVENT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Anime Expo"))
                .andExpect(jsonPath("$.data.status").value("COMING_SOON"));
    }

    @Test
    @DisplayName("POST /api/admin/events — deve retornar 201 ao criar evento")
    void deveRetornar201AoCriarEvento() throws Exception {
        when(createEventUseCase.execute(
                any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(boolean.class),
                any(), any()
        )).thenReturn(buildEvent());

        mockMvc.perform(post("/api/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "Anime Expo",
                                    "startDate": "2026-05-01T10:00:00",
                                    "endDate": "2026-05-03T18:00:00",
                                    "timeline": "UPCOMING",
                                    "status": "COMING_SOON",
                                    "type": "CONVENCAO",
                                    "locationIsOnline": false,
                                    "isFeatured": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Anime Expo"));
    }

    @Test
    @DisplayName("PATCH /api/admin/events/{id} — deve retornar 200 ao atualizar")
    void deveRetornar200AoAtualizar() throws Exception {
        Event updated = buildEvent();
        updated.setTitle("Updated Expo");
        when(updateEventUseCase.execute(
                eq(EVENT_ID), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(updated);

        mockMvc.perform(patch("/api/admin/events/" + EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated Expo"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated Expo"));
    }

    @Test
    @DisplayName("DELETE /api/admin/events/{id} — deve retornar 204")
    void deveRetornar204AoExcluir() throws Exception {
        mockMvc.perform(delete("/api/admin/events/" + EVENT_ID))
                .andExpect(status().isNoContent());
    }
}

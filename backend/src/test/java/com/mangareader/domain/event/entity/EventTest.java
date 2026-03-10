package com.mangareader.domain.event.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

class EventTest {

    @Nested
    @DisplayName("Builder — valores default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve iniciar com defaults corretos no builder")
        void shouldInitializeDefaults() {
            Event event = Event.builder()
                    .title("Anime Expo 2025")
                    .startDate(LocalDateTime.of(2025, 7, 3, 10, 0))
                    .endDate(LocalDateTime.of(2025, 7, 6, 22, 0))
                    .timeline(EventTimeline.UPCOMING)
                    .status(EventStatus.COMING_SOON)
                    .type(EventType.CONVENCAO)
                    .build();

            assertNotNull(event.getGallery());
            assertTrue(event.getGallery().isEmpty());
            assertEquals(0, event.getParticipants());
            assertEquals(0, event.getInterested());
            assertFalse(event.isFeatured());
            assertNotNull(event.getSchedule());
            assertTrue(event.getSchedule().isEmpty());
            assertNotNull(event.getSpecialGuests());
            assertTrue(event.getSpecialGuests().isEmpty());
            assertNotNull(event.getTickets());
            assertTrue(event.getTickets().isEmpty());
            assertNotNull(event.getRelatedEventIds());
            assertTrue(event.getRelatedEventIds().isEmpty());
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            EventLocation location = EventLocation.builder()
                    .label("São Paulo Expo")
                    .address("Rodovia dos Imigrantes, km 1,5")
                    .city("São Paulo")
                    .isOnline(false)
                    .mapLink("https://maps.example.com")
                    .directions("Seguir pela Imigrantes")
                    .build();

            EventOrganizer organizer = EventOrganizer.builder()
                    .organizerId("org-1")
                    .organizerName("MangaCon Brasil")
                    .organizerAvatar("https://example.com/avatar.jpg")
                    .organizerProfileLink("https://example.com/profile")
                    .organizerContact("contato@mangacon.com")
                    .build();

            Event event = Event.builder()
                    .title("MangaCon Brasil 2025")
                    .subtitle("O maior evento de mangá do Brasil")
                    .description("Descrição completa do evento")
                    .image("https://example.com/event.jpg")
                    .gallery(List.of("img1.jpg", "img2.jpg"))
                    .startDate(LocalDateTime.of(2025, 8, 15, 9, 0))
                    .endDate(LocalDateTime.of(2025, 8, 17, 20, 0))
                    .timezone("America/Sao_Paulo")
                    .timeline(EventTimeline.UPCOMING)
                    .status(EventStatus.REGISTRATIONS_OPEN)
                    .type(EventType.CONVENCAO)
                    .location(location)
                    .organizer(organizer)
                    .priceLabel("A partir de R$ 50,00")
                    .participants(500)
                    .interested(2000)
                    .isFeatured(true)
                    .schedule(List.of("09:00 - Abertura", "10:00 - Painel"))
                    .specialGuests(List.of("Eiichiro Oda", "Akira Toriyama"))
                    .relatedEventIds(List.of("event-2", "event-3"))
                    .build();

            assertEquals("MangaCon Brasil 2025", event.getTitle());
            assertEquals("O maior evento de mangá do Brasil", event.getSubtitle());
            assertEquals(EventTimeline.UPCOMING, event.getTimeline());
            assertEquals(EventStatus.REGISTRATIONS_OPEN, event.getStatus());
            assertEquals(EventType.CONVENCAO, event.getType());
            assertNotNull(event.getLocation());
            assertEquals("São Paulo", event.getLocation().getCity());
            assertFalse(event.getLocation().isOnline());
            assertNotNull(event.getOrganizer());
            assertEquals("MangaCon Brasil", event.getOrganizer().getOrganizerName());
            assertEquals(500, event.getParticipants());
            assertEquals(2000, event.getInterested());
            assertTrue(event.isFeatured());
            assertEquals(2, event.getSchedule().size());
            assertEquals(2, event.getSpecialGuests().size());
            assertEquals(2, event.getRelatedEventIds().size());
        }
    }

    @Nested
    @DisplayName("Embedded objects")
    class EmbeddedObjectTests {

        @Test
        @DisplayName("EventLocation deve suportar eventos online")
        void shouldSupportOnlineEvents() {
            EventLocation location = EventLocation.builder()
                    .label("Discord Server")
                    .isOnline(true)
                    .build();

            assertTrue(location.isOnline());
            assertEquals("Discord Server", location.getLabel());
            assertNull(location.getAddress());
            assertNull(location.getCity());
        }

        @Test
        @DisplayName("EventLocation deve suportar eventos presenciais")
        void shouldSupportPhysicalEvents() {
            EventLocation location = EventLocation.builder()
                    .label("Centro de Convenções")
                    .address("Av. Principal, 100")
                    .city("Rio de Janeiro")
                    .isOnline(false)
                    .mapLink("https://maps.example.com/rio")
                    .directions("Próximo ao metrô")
                    .build();

            assertFalse(location.isOnline());
            assertEquals("Rio de Janeiro", location.getCity());
            assertNotNull(location.getMapLink());
        }

        @Test
        @DisplayName("EventOrganizer deve definir todos os campos")
        void shouldSetOrganizerFields() {
            EventOrganizer org = EventOrganizer.builder()
                    .organizerId("org-1")
                    .organizerName("Organizador Teste")
                    .organizerAvatar("avatar.jpg")
                    .organizerProfileLink("/profile/org-1")
                    .organizerContact("email@test.com")
                    .build();

            assertEquals("org-1", org.getOrganizerId());
            assertEquals("Organizador Teste", org.getOrganizerName());
            assertEquals("email@test.com", org.getOrganizerContact());
        }
    }

    @Nested
    @DisplayName("Tickets")
    class TicketTests {

        @Test
        @DisplayName("Deve permitir adicionar tickets ao evento")
        void shouldAddTicketsToEvent() {
            Event event = Event.builder()
                    .title("Evento teste")
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(1))
                    .timeline(EventTimeline.UPCOMING)
                    .status(EventStatus.REGISTRATIONS_OPEN)
                    .type(EventType.MEETUP)
                    .build();

            EventTicket vip = EventTicket.builder()
                    .event(event)
                    .name("VIP")
                    .price("R$ 200,00")
                    .available(50)
                    .build();

            EventTicket standard = EventTicket.builder()
                    .event(event)
                    .name("Padrão")
                    .price("R$ 50,00")
                    .available(200)
                    .build();

            event.getTickets().addAll(List.of(vip, standard));

            assertEquals(2, event.getTickets().size());
            assertEquals("VIP", event.getTickets().get(0).getName());
            assertEquals(50, event.getTickets().get(0).getAvailable());
        }

        @Test
        @DisplayName("EventTicket deve ter available default = 0")
        void ticketShouldHaveDefaultAvailableZero() {
            EventTicket ticket = EventTicket.builder()
                    .name("Ingresso")
                    .price("R$ 100,00")
                    .build();

            assertEquals(0, ticket.getAvailable());
        }
    }

    @Nested
    @DisplayName("Enums de evento")
    class EnumTests {

        @Test
        @DisplayName("EventType deve ter 5 tipos com displayName")
        void shouldHaveFiveEventTypes() {
            assertEquals(5, EventType.values().length);
            assertEquals("Convenção", EventType.CONVENCAO.getDisplayName());
            assertEquals("Lançamento", EventType.LANCAMENTO.getDisplayName());
            assertEquals("Live", EventType.LIVE.getDisplayName());
            assertEquals("Workshop", EventType.WORKSHOP.getDisplayName());
            assertEquals("Meetup", EventType.MEETUP.getDisplayName());
        }

        @Test
        @DisplayName("EventStatus deve ter 4 status com value")
        void shouldHaveFourEventStatuses() {
            assertEquals(4, EventStatus.values().length);
            assertEquals("happening_now", EventStatus.HAPPENING_NOW.getValue());
            assertEquals("registrations_open", EventStatus.REGISTRATIONS_OPEN.getValue());
            assertEquals("coming_soon", EventStatus.COMING_SOON.getValue());
            assertEquals("ended", EventStatus.ENDED.getValue());
        }

        @Test
        @DisplayName("EventTimeline deve ter 3 valores")
        void shouldHaveThreeTimelineValues() {
            assertEquals(3, EventTimeline.values().length);
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Event event = new Event();

            assertNull(event.getId());
            assertNull(event.getTitle());
            assertNull(event.getStartDate());
            assertNull(event.getEndDate());
            assertNull(event.getTimeline());
            assertNull(event.getStatus());
            assertNull(event.getType());
            assertNull(event.getLocation());
            assertNull(event.getOrganizer());
            assertNull(event.getCreatedAt());
            assertNull(event.getUpdatedAt());
        }
    }
}

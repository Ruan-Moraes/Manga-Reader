package com.mangareader.domain.event.entity;

import static org.assertj.core.api.Assertions.assertThat;

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
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Anime Expo 2025"))
                    .startDate(LocalDateTime.of(2025, 7, 3, 10, 0))
                    .endDate(LocalDateTime.of(2025, 7, 6, 22, 0))
                    .timeline(EventTimeline.UPCOMING)
                    .status(EventStatus.COMING_SOON)
                    .type(EventType.CONVENCAO)
                    .build();

            assertThat(event.getGallery()).isNotNull();
            assertThat(event.getGallery().isEmpty()).isTrue();
            assertThat(event.getParticipants()).isEqualTo(0);
            assertThat(event.getInterested()).isEqualTo(0);
            assertThat(event.isFeatured()).isFalse();
            assertThat(event.getSchedule()).isNotNull();
            assertThat(event.getSchedule().isEmpty()).isTrue();
            assertThat(event.getSpecialGuests()).isNotNull();
            assertThat(event.getSpecialGuests().isEmpty()).isTrue();
            assertThat(event.getTickets()).isNotNull();
            assertThat(event.getTickets().isEmpty()).isTrue();
            assertThat(event.getRelatedEventIds()).isNotNull();
            assertThat(event.getRelatedEventIds().isEmpty()).isTrue();
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
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("MangaCon Brasil 2025"))
                    .subtitle(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("O maior evento de mangá do Brasil"))
                    .description(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Descrição completa do evento"))
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

            assertThat(event.getTitle().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("MangaCon Brasil 2025");
            assertThat(event.getSubtitle().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("O maior evento de mangá do Brasil");
            assertThat(event.getTimeline()).isEqualTo(EventTimeline.UPCOMING);
            assertThat(event.getStatus()).isEqualTo(EventStatus.REGISTRATIONS_OPEN);
            assertThat(event.getType()).isEqualTo(EventType.CONVENCAO);
            assertThat(event.getLocation()).isNotNull();
            assertThat(event.getLocation().getCity()).isEqualTo("São Paulo");
            assertThat(event.getLocation().isOnline()).isFalse();
            assertThat(event.getOrganizer()).isNotNull();
            assertThat(event.getOrganizer().getOrganizerName()).isEqualTo("MangaCon Brasil");
            assertThat(event.getParticipants()).isEqualTo(500);
            assertThat(event.getInterested()).isEqualTo(2000);
            assertThat(event.isFeatured()).isTrue();
            assertThat(event.getSchedule().size()).isEqualTo(2);
            assertThat(event.getSpecialGuests().size()).isEqualTo(2);
            assertThat(event.getRelatedEventIds().size()).isEqualTo(2);
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

            assertThat(location.isOnline()).isTrue();
            assertThat(location.getLabel()).isEqualTo("Discord Server");
            assertThat(location.getAddress()).isNull();
            assertThat(location.getCity()).isNull();
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

            assertThat(location.isOnline()).isFalse();
            assertThat(location.getCity()).isEqualTo("Rio de Janeiro");
            assertThat(location.getMapLink()).isNotNull();
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

            assertThat(org.getOrganizerId()).isEqualTo("org-1");
            assertThat(org.getOrganizerName()).isEqualTo("Organizador Teste");
            assertThat(org.getOrganizerContact()).isEqualTo("email@test.com");
        }
    }

    @Nested
    @DisplayName("Tickets")
    class TicketTests {

        @Test
        @DisplayName("Deve permitir adicionar tickets ao evento")
        void shouldAddTicketsToEvent() {
            Event event = Event.builder()
                    .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Evento teste"))
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(1))
                    .timeline(EventTimeline.UPCOMING)
                    .status(EventStatus.REGISTRATIONS_OPEN)
                    .type(EventType.MEETUP)
                    .build();

            EventTicket vip = EventTicket.builder()
                    .event(event)
                    .name("VIP")
                    .priceInCents(20000)
                    .available(50)
                    .build();

            EventTicket standard = EventTicket.builder()
                    .event(event)
                    .name("Padrão")
                    .priceInCents(5000)
                    .available(200)
                    .build();

            event.getTickets().addAll(List.of(vip, standard));

            assertThat(event.getTickets().size()).isEqualTo(2);
            assertThat(event.getTickets().get(0).getName()).isEqualTo("VIP");
            assertThat(event.getTickets().get(0).getAvailable()).isEqualTo(50);
        }

        @Test
        @DisplayName("EventTicket deve ter available default = 0")
        void ticketShouldHaveDefaultAvailableZero() {
            EventTicket ticket = EventTicket.builder()
                    .name("Ingresso")
                    .priceInCents(10000)
                    .build();

            assertThat(ticket.getAvailable()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Enums de evento")
    class EnumTests {

        @Test
        @DisplayName("EventType deve ter 5 tipos com displayName")
        void shouldHaveFiveEventTypes() {
            assertThat(EventType.values().length).isEqualTo(5);
            assertThat(EventType.CONVENCAO.getDisplayName()).isEqualTo("Convenção");
            assertThat(EventType.LANCAMENTO.getDisplayName()).isEqualTo("Lançamento");
            assertThat(EventType.LIVE.getDisplayName()).isEqualTo("Live");
            assertThat(EventType.WORKSHOP.getDisplayName()).isEqualTo("Workshop");
            assertThat(EventType.MEETUP.getDisplayName()).isEqualTo("Meetup");
        }

        @Test
        @DisplayName("EventStatus deve ter 4 status com value")
        void shouldHaveFourEventStatuses() {
            assertThat(EventStatus.values().length).isEqualTo(4);
            assertThat(EventStatus.HAPPENING_NOW.getValue()).isEqualTo("happening_now");
            assertThat(EventStatus.REGISTRATIONS_OPEN.getValue()).isEqualTo("registrations_open");
            assertThat(EventStatus.COMING_SOON.getValue()).isEqualTo("coming_soon");
            assertThat(EventStatus.ENDED.getValue()).isEqualTo("ended");
        }

        @Test
        @DisplayName("EventTimeline deve ter 3 valores")
        void shouldHaveThreeTimelineValues() {
            assertThat(EventTimeline.values().length).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Event event = new Event();

            assertThat(event.getId()).isNull();
            assertThat(event.getTitle().isEmpty()).isTrue();
            assertThat(event.getStartDate()).isNull();
            assertThat(event.getEndDate()).isNull();
            assertThat(event.getTimeline()).isNull();
            assertThat(event.getStatus()).isNull();
            assertThat(event.getType()).isNull();
            assertThat(event.getLocation()).isNull();
            assertThat(event.getOrganizer()).isNull();
            assertThat(event.getCreatedAt()).isNull();
            assertThat(event.getUpdatedAt()).isNull();
        }
    }
}

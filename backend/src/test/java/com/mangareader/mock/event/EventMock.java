package com.mangareader.mock.event;

import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.entity.EventParticipant;
import com.mangareader.domain.event.entity.EventTicket;
import com.mangareader.domain.event.valueobject.*;
import com.mangareader.domain.user.entity.User;
import com.mangareader.mock.user.UserMock;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class EventMock {

    private EventMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final UUID EVENT_1_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");
    public static final UUID EVENT_2_ID = UUID.fromString("20000000-0000-0000-0000-000000000002");
    public static final UUID EVENT_3_ID = UUID.fromString("20000000-0000-0000-0000-000000000003");
    public static final UUID EVENT_4_ID = UUID.fromString("20000000-0000-0000-0000-000000000004");

    // ── Locations ──────────────────────────────────────────────────────────

    public static EventLocation presentialLocation() {
        return EventLocation.builder()
                .label("Centro de Convencoes Manga SP")
                .address("Av. Paulista, 1000")
                .city("Sao Paulo")
                .isOnline(false)
                .mapLink("https://maps.google.com/?q=-23.5505,-46.6333")
                .directions("Metro Trianon-MASP, saida 2")
                .build();
    }

    public static EventLocation onlineLocation() {
        return EventLocation.builder()
                .label("Discord Server")
                .isOnline(true)
                .build();
    }

    public static EventLocation hybridLocation() {
        return EventLocation.builder()
                .label("Livraria Cultura + Transmissao Online")
                .address("Rua Augusta, 500")
                .city("Sao Paulo")
                .isOnline(true)
                .mapLink("https://maps.google.com/?q=-23.55,-46.65")
                .build();
    }

    // ── Organizers ─────────────────────────────────────────────────────────

    public static EventOrganizer mainOrganizer() {
        return EventOrganizer.builder()
                .organizerId(UserMock.ADMIN_ID.toString())
                .organizerName("Ana Beatriz")
                .organizerAvatar("https://i.pravatar.cc/100?img=21")
                .organizerProfileLink("/users/" + UserMock.ADMIN_ID)
                .organizerContact("eventos@mangareader.com")
                .build();
    }

    // ── Tickets ────────────────────────────────────────────────────────────

    public static EventTicket freeTicket(Event event) {
        return EventTicket.builder()
                .id(UUID.randomUUID())
                .event(event)
                .name("Entrada Gratuita")
                .price("Gratis")
                .available(500)
                .build();
    }

    public static EventTicket vipTicket(Event event) {
        return EventTicket.builder()
                .id(UUID.randomUUID())
                .event(event)
                .name("VIP")
                .price("R$ 150,00")
                .available(50)
                .build();
    }

    public static EventTicket soldOutTicket(Event event) {
        return EventTicket.builder()
                .id(UUID.randomUUID())
                .event(event)
                .name("Early Bird")
                .price("R$ 80,00")
                .available(0)
                .build();
    }

    // ── Participants ───────────────────────────────────────────────────────

    public static EventParticipant participant(Event event, User user) {
        return EventParticipant.builder()
                .id(UUID.randomUUID())
                .event(event)
                .user(user)
                .build();
    }

    // ── Events ─────────────────────────────────────────────────────────────

    public static Event upcomingPresential() {
        Event event = Event.builder()
                .id(EVENT_1_ID)
                .title("Manga Fest 2026")
                .subtitle("O maior evento de manga do Brasil")
                .description("Tres dias de paineis, cosplay, sessoes de autografos e lancamentos exclusivos.")
                .image("https://picsum.photos/800/400?random=e1")
                .gallery(new ArrayList<>(List.of(
                        "https://picsum.photos/800/400?random=e1a",
                        "https://picsum.photos/800/400?random=e1b"
                )))
                .startDate(LocalDateTime.of(2026, 7, 15, 9, 0))
                .endDate(LocalDateTime.of(2026, 7, 17, 22, 0))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.REGISTRATIONS_OPEN)
                .type(EventType.CONVENCAO)
                .location(presentialLocation())
                .organizer(mainOrganizer())
                .priceLabel("A partir de Gratis")
                .participants(320)
                .interested(1500)
                .isFeatured(true)
                .schedule(new ArrayList<>(List.of(
                        "09:00 - Abertura dos portoes",
                        "10:00 - Painel: O futuro do manga no Brasil",
                        "14:00 - Concurso de cosplay",
                        "18:00 - Sessao de autografos"
                )))
                .specialGuests(new ArrayList<>(List.of("Takeshi Yamamoto", "Park Min-jun")))
                .tickets(new ArrayList<>())
                .relatedEventIds(new ArrayList<>(List.of(EVENT_2_ID.toString())))
                .build();

        event.getTickets().add(freeTicket(event));
        event.getTickets().add(vipTicket(event));
        return event;
    }

    public static Event ongoingOnline() {
        Event event = Event.builder()
                .id(EVENT_2_ID)
                .title("Maratona de Leitura Online")
                .subtitle("24 horas de leitura coletiva")
                .description("Leia junto com a comunidade durante 24 horas. Premios para quem ler mais capitulos.")
                .image("https://picsum.photos/800/400?random=e2")
                .gallery(new ArrayList<>())
                .startDate(LocalDateTime.of(2026, 3, 14, 0, 0))
                .endDate(LocalDateTime.of(2026, 3, 14, 23, 59))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.ONGOING)
                .status(EventStatus.HAPPENING_NOW)
                .type(EventType.LIVE)
                .location(onlineLocation())
                .organizer(mainOrganizer())
                .priceLabel("Gratis")
                .participants(180)
                .interested(600)
                .schedule(new ArrayList<>(List.of(
                        "00:00 - Inicio da maratona",
                        "12:00 - Check-in intermediario",
                        "23:59 - Encerramento e premiacao"
                )))
                .specialGuests(new ArrayList<>())
                .tickets(new ArrayList<>())
                .relatedEventIds(new ArrayList<>())
                .build();

        event.getTickets().add(freeTicket(event));
        return event;
    }

    public static Event pastEvent() {
        Event event = Event.builder()
                .id(EVENT_3_ID)
                .title("Workshop de Desenho Manga")
                .subtitle("Aprenda tecnicas basicas de desenho manga")
                .description("Workshop presencial com artistas profissionais.")
                .image("https://picsum.photos/800/400?random=e3")
                .gallery(new ArrayList<>(List.of(
                        "https://picsum.photos/800/400?random=e3a",
                        "https://picsum.photos/800/400?random=e3b",
                        "https://picsum.photos/800/400?random=e3c"
                )))
                .startDate(LocalDateTime.of(2025, 11, 20, 14, 0))
                .endDate(LocalDateTime.of(2025, 11, 20, 18, 0))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.PAST)
                .status(EventStatus.ENDED)
                .type(EventType.WORKSHOP)
                .location(hybridLocation())
                .organizer(mainOrganizer())
                .priceLabel("R$ 50,00")
                .participants(45)
                .interested(200)
                .schedule(new ArrayList<>(List.of(
                        "14:00 - Introducao ao manga",
                        "15:30 - Pratica guiada",
                        "17:00 - Feedback e encerramento"
                )))
                .specialGuests(new ArrayList<>(List.of("Liu Mei")))
                .tickets(new ArrayList<>())
                .relatedEventIds(new ArrayList<>())
                .build();

        event.getTickets().add(soldOutTicket(event));
        return event;
    }

    public static Event cancelledEvent() {
        return Event.builder()
                .id(EVENT_4_ID)
                .title("Encontro de Colecionadores")
                .description("Cancelado por falta de inscricoes.")
                .image("https://picsum.photos/800/400?random=e4")
                .gallery(new ArrayList<>())
                .startDate(LocalDateTime.of(2026, 5, 1, 10, 0))
                .endDate(LocalDateTime.of(2026, 5, 1, 18, 0))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.CONVENCAO)
                .location(presentialLocation())
                .organizer(mainOrganizer())
                .participants(0)
                .interested(15)
                .schedule(new ArrayList<>())
                .specialGuests(new ArrayList<>())
                .tickets(new ArrayList<>())
                .relatedEventIds(new ArrayList<>())
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<Event> allEvents() {
        return List.of(upcomingPresential(), ongoingOnline(), pastEvent(), cancelledEvent());
    }

    public static List<Event> activeEvents() {
        return List.of(upcomingPresential(), ongoingOnline());
    }

    public static List<Event> featuredEvents() {
        return List.of(upcomingPresential());
    }
}

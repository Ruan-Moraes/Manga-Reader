package com.mangareader.domain.event.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("EventTicket")
class EventTicketTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Event event = Event.builder().title("Anime Expo").build();

            EventTicket ticket = EventTicket.builder()
                    .id(id)
                    .event(event)
                    .name("VIP")
                    .price("R$ 150,00")
                    .available(100)
                    .build();

            assertEquals(id, ticket.getId());
            assertEquals(event, ticket.getEvent());
            assertEquals("VIP", ticket.getName());
            assertEquals("R$ 150,00", ticket.getPrice());
            assertEquals(100, ticket.getAvailable());
        }

        @Test
        @DisplayName("Deve inicializar available=0 por padrão via @Builder.Default")
        void shouldDefaultAvailableToZero() {
            EventTicket ticket = EventTicket.builder()
                    .name("Standard")
                    .price("R$ 50,00")
                    .build();

            assertEquals(0, ticket.getAvailable());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            EventTicket ticket = new EventTicket();

            assertNull(ticket.getId());
            assertNull(ticket.getEvent());
            assertNull(ticket.getName());
            assertNull(ticket.getPrice());
        }
    }
}

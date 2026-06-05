package com.mangareader.domain.event.entity;

import static org.assertj.core.api.Assertions.assertThat;

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
            Event event = Event.builder().title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Anime Expo")).build();

            EventTicket ticket = EventTicket.builder()
                    .id(id)
                    .event(event)
                    .name("VIP")
                    .price("R$ 150,00")
                    .available(100)
                    .build();

            assertThat(ticket.getId()).isEqualTo(id);
            assertThat(ticket.getEvent()).isEqualTo(event);
            assertThat(ticket.getName()).isEqualTo("VIP");
            assertThat(ticket.getPrice()).isEqualTo("R$ 150,00");
            assertThat(ticket.getAvailable()).isEqualTo(100);
        }

        @Test
        @DisplayName("Deve inicializar available=0 por padrão via @Builder.Default")
        void shouldDefaultAvailableToZero() {
            EventTicket ticket = EventTicket.builder()
                    .name("Standard")
                    .price("R$ 50,00")
                    .build();

            assertThat(ticket.getAvailable()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            EventTicket ticket = new EventTicket();

            assertThat(ticket.getId()).isNull();
            assertThat(ticket.getEvent()).isNull();
            assertThat(ticket.getName()).isNull();
            assertThat(ticket.getPrice()).isNull();
        }
    }
}

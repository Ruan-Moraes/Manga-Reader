package com.mangareader.domain.event.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.entity.User;

@DisplayName("EventParticipant")
class EventParticipantTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Event event = Event.builder().title("Anime Expo").build();
            User user = User.builder().name("Ruan").email("ruan@test.com").build();
            LocalDateTime joinedAt = LocalDateTime.now();

            EventParticipant participant = EventParticipant.builder()
                    .id(id)
                    .event(event)
                    .user(user)
                    .joinedAt(joinedAt)
                    .build();

            assertEquals(id, participant.getId());
            assertEquals(event, participant.getEvent());
            assertEquals(user, participant.getUser());
            assertEquals(joinedAt, participant.getJoinedAt());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            EventParticipant participant = new EventParticipant();

            assertNull(participant.getId());
            assertNull(participant.getEvent());
            assertNull(participant.getUser());
            assertNull(participant.getJoinedAt());
        }
    }
}

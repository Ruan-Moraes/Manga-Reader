package com.mangareader.domain.event.entity;

import static org.assertj.core.api.Assertions.assertThat;

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
            Event event = Event.builder().title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Anime Expo")).build();
            User user = User.builder().name("Ruan").email("ruan@test.com").build();
            LocalDateTime joinedAt = LocalDateTime.now();

            EventParticipant participant = EventParticipant.builder()
                    .id(id)
                    .event(event)
                    .user(user)
                    .joinedAt(joinedAt)
                    .build();

            assertThat(participant.getId()).isEqualTo(id);
            assertThat(participant.getEvent()).isEqualTo(event);
            assertThat(participant.getUser()).isEqualTo(user);
            assertThat(participant.getJoinedAt()).isEqualTo(joinedAt);
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            EventParticipant participant = new EventParticipant();

            assertThat(participant.getId()).isNull();
            assertThat(participant.getEvent()).isNull();
            assertThat(participant.getUser()).isNull();
            assertThat(participant.getJoinedAt()).isNull();
        }
    }
}

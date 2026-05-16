package com.mangareader.domain.event.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("EventOrganizer")
class EventOrganizerTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            EventOrganizer organizer = EventOrganizer.builder()
                    .organizerId("org-001")
                    .organizerName("Manga Corp")
                    .organizerAvatar("https://example.com/avatar.jpg")
                    .organizerProfileLink("https://example.com/profile/manga-corp")
                    .organizerContact("contato@mangacorp.com")
                    .build();

            assertThat(organizer.getOrganizerId()).isEqualTo("org-001");
            assertThat(organizer.getOrganizerName()).isEqualTo("Manga Corp");
            assertThat(organizer.getOrganizerAvatar()).isEqualTo("https://example.com/avatar.jpg");
            assertThat(organizer.getOrganizerProfileLink()).isEqualTo("https://example.com/profile/manga-corp");
            assertThat(organizer.getOrganizerContact()).isEqualTo("contato@mangacorp.com");
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            EventOrganizer organizer = new EventOrganizer();

            assertThat(organizer.getOrganizerId()).isNull();
            assertThat(organizer.getOrganizerName()).isNull();
            assertThat(organizer.getOrganizerAvatar()).isNull();
            assertThat(organizer.getOrganizerProfileLink()).isNull();
            assertThat(organizer.getOrganizerContact()).isNull();
        }
    }
}

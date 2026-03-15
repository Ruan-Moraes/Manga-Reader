package com.mangareader.domain.event.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

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

            assertEquals("org-001", organizer.getOrganizerId());
            assertEquals("Manga Corp", organizer.getOrganizerName());
            assertEquals("https://example.com/avatar.jpg", organizer.getOrganizerAvatar());
            assertEquals("https://example.com/profile/manga-corp", organizer.getOrganizerProfileLink());
            assertEquals("contato@mangacorp.com", organizer.getOrganizerContact());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            EventOrganizer organizer = new EventOrganizer();

            assertNull(organizer.getOrganizerId());
            assertNull(organizer.getOrganizerName());
            assertNull(organizer.getOrganizerAvatar());
            assertNull(organizer.getOrganizerProfileLink());
            assertNull(organizer.getOrganizerContact());
        }
    }
}

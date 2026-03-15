package com.mangareader.domain.event.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("EventLocation")
class EventLocationTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            EventLocation location = EventLocation.builder()
                    .label("Centro de Convencoes")
                    .address("Rua A, 123")
                    .city("Sao Paulo")
                    .isOnline(false)
                    .mapLink("https://maps.google.com/xyz")
                    .directions("Proximo ao metro")
                    .build();

            assertEquals("Centro de Convencoes", location.getLabel());
            assertEquals("Rua A, 123", location.getAddress());
            assertEquals("Sao Paulo", location.getCity());
            assertFalse(location.isOnline());
            assertEquals("https://maps.google.com/xyz", location.getMapLink());
            assertEquals("Proximo ao metro", location.getDirections());
        }

        @Test
        @DisplayName("Deve criar evento online")
        void shouldBuildOnlineEvent() {
            EventLocation location = EventLocation.builder()
                    .label("YouTube Live")
                    .isOnline(true)
                    .build();

            assertTrue(location.isOnline());
            assertEquals("YouTube Live", location.getLabel());
            assertNull(location.getAddress());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia — isOnline default false")
        void shouldCreateEmptyInstance() {
            EventLocation location = new EventLocation();

            assertNull(location.getLabel());
            assertNull(location.getAddress());
            assertNull(location.getCity());
            assertFalse(location.isOnline());
            assertNull(location.getMapLink());
            assertNull(location.getDirections());
        }
    }

    @Nested
    @DisplayName("Getters e Setters")
    class GetterSetterTests {

        @Test
        @DisplayName("Deve atualizar isOnline via setter")
        void shouldUpdateIsOnlineViaSetter() {
            EventLocation location = new EventLocation();
            location.setOnline(true);

            assertTrue(location.isOnline());
        }
    }
}

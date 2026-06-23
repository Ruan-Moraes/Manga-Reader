package com.mangareader.domain.event.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

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

            assertThat(location.getLabel()).isEqualTo("Centro de Convencoes");
            assertThat(location.getAddress()).isEqualTo("Rua A, 123");
            assertThat(location.getCity()).isEqualTo("Sao Paulo");
            assertThat(location.isOnline()).isFalse();
            assertThat(location.getMapLink()).isEqualTo("https://maps.google.com/xyz");
            assertThat(location.getDirections()).isEqualTo("Proximo ao metro");
        }

        @Test
        @DisplayName("Deve criar evento online")
        void shouldBuildOnlineEvent() {
            EventLocation location = EventLocation.builder()
                    .label("YouTube Live")
                    .isOnline(true)
                    .build();

            assertThat(location.isOnline()).isTrue();
            assertThat(location.getLabel()).isEqualTo("YouTube Live");
            assertThat(location.getAddress()).isNull();
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia — isOnline default false")
        void shouldCreateEmptyInstance() {
            EventLocation location = new EventLocation();

            assertThat(location.getLabel()).isNull();
            assertThat(location.getAddress()).isNull();
            assertThat(location.getCity()).isNull();
            assertThat(location.isOnline()).isFalse();
            assertThat(location.getMapLink()).isNull();
            assertThat(location.getDirections()).isNull();
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

            assertThat(location.isOnline()).isTrue();
        }
    }
}

package com.mangareader.domain.event.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Enums de Event")
class EventEnumsTest {

    @Nested
    @DisplayName("EventStatus")
    class EventStatusTests {

        @Test
        @DisplayName("Deve conter 4 valores")
        void shouldHaveFourValues() {
            assertThat(EventStatus.values().length).isEqualTo(4);
        }

        @Test
        @DisplayName("Deve retornar getValue() correto para cada status")
        void shouldReturnCorrectValues() {
            assertThat(EventStatus.HAPPENING_NOW.getValue()).isEqualTo("happening_now");
            assertThat(EventStatus.REGISTRATIONS_OPEN.getValue()).isEqualTo("registrations_open");
            assertThat(EventStatus.COMING_SOON.getValue()).isEqualTo("coming_soon");
            assertThat(EventStatus.ENDED.getValue()).isEqualTo("ended");
        }
    }

    @Nested
    @DisplayName("EventTimeline")
    class EventTimelineTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertThat(EventTimeline.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve conter todos os valores esperados")
        void shouldContainExpectedValues() {
            EventTimeline[] values = EventTimeline.values();
            assertThat(values[0]).isEqualTo(EventTimeline.UPCOMING);
            assertThat(values[1]).isEqualTo(EventTimeline.ONGOING);
            assertThat(values[2]).isEqualTo(EventTimeline.PAST);
        }
    }

    @Nested
    @DisplayName("EventType")
    class EventTypeTests {

        @Test
        @DisplayName("Deve conter 5 valores")
        void shouldHaveFiveValues() {
            assertThat(EventType.values().length).isEqualTo(5);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada tipo")
        void shouldReturnCorrectDisplayNames() {
            assertThat(EventType.CONVENCAO.getDisplayName()).isEqualTo("Convenção");
            assertThat(EventType.LANCAMENTO.getDisplayName()).isEqualTo("Lançamento");
            assertThat(EventType.LIVE.getDisplayName()).isEqualTo("Live");
            assertThat(EventType.WORKSHOP.getDisplayName()).isEqualTo("Workshop");
            assertThat(EventType.MEETUP.getDisplayName()).isEqualTo("Meetup");
        }
    }
}

package com.mangareader.domain.event.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
            assertEquals(4, EventStatus.values().length);
        }

        @Test
        @DisplayName("Deve retornar getValue() correto para cada status")
        void shouldReturnCorrectValues() {
            assertEquals("happening_now", EventStatus.HAPPENING_NOW.getValue());
            assertEquals("registrations_open", EventStatus.REGISTRATIONS_OPEN.getValue());
            assertEquals("coming_soon", EventStatus.COMING_SOON.getValue());
            assertEquals("ended", EventStatus.ENDED.getValue());
        }
    }

    @Nested
    @DisplayName("EventTimeline")
    class EventTimelineTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertEquals(3, EventTimeline.values().length);
        }

        @Test
        @DisplayName("Deve conter todos os valores esperados")
        void shouldContainExpectedValues() {
            EventTimeline[] values = EventTimeline.values();
            assertEquals(EventTimeline.UPCOMING, values[0]);
            assertEquals(EventTimeline.ONGOING, values[1]);
            assertEquals(EventTimeline.PAST, values[2]);
        }
    }

    @Nested
    @DisplayName("EventType")
    class EventTypeTests {

        @Test
        @DisplayName("Deve conter 5 valores")
        void shouldHaveFiveValues() {
            assertEquals(5, EventType.values().length);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada tipo")
        void shouldReturnCorrectDisplayNames() {
            assertEquals("Convenção", EventType.CONVENCAO.getDisplayName());
            assertEquals("Lançamento", EventType.LANCAMENTO.getDisplayName());
            assertEquals("Live", EventType.LIVE.getDisplayName());
            assertEquals("Workshop", EventType.WORKSHOP.getDisplayName());
            assertEquals("Meetup", EventType.MEETUP.getDisplayName());
        }
    }
}

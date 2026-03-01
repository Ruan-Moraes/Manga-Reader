package com.mangareader.domain.event.valueobject;

/**
 * Timeline do evento (passado, em andamento, futuro).
 * <p>
 * Compatível com o frontend ({@code EventTimeline} em event.types.ts).
 */
public enum EventTimeline {
    UPCOMING,
    ONGOING,
    PAST
}

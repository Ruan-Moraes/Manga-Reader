package com.mangareader.domain.event.valueobject;

/**
 * Status de um evento.
 * <p>
 * Compatível com o frontend ({@code EventStatus} em event.types.ts).
 */
public enum EventStatus {
    HAPPENING_NOW("happening_now"),
    REGISTRATIONS_OPEN("registrations_open"),
    COMING_SOON("coming_soon"),
    ENDED("ended");

    private final String value;

    EventStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

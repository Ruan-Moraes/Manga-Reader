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

    /**
     * Resolve um status a partir do seu {@code value} (frontend) ou do nome do enum,
     * case-insensitive. Mantém o parsing no domínio, fora dos controllers.
     */
    public static EventStatus fromValue(String value) {
        for (EventStatus status : values()) {
            if (status.value.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }

        throw new IllegalArgumentException("Status de evento inválido: " + value);
    }
}

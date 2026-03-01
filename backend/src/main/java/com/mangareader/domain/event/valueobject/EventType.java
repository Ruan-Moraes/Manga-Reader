package com.mangareader.domain.event.valueobject;

/**
 * Tipo de evento.
 * <p>
 * Compatível com o frontend ({@code EventType} em event.types.ts).
 */
public enum EventType {
    CONVENCAO("Convenção"),
    LANCAMENTO("Lançamento"),
    LIVE("Live"),
    WORKSHOP("Workshop"),
    MEETUP("Meetup");

    private final String displayName;

    EventType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

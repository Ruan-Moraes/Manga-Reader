package com.mangareader.domain.event.valueobject;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Organizador de um evento (embeddable JPA).
 * <p>
 * Compatível com o frontend ({@code EventData.organizer} em event.types.ts).
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventOrganizer {

    private String organizerId;
    private String organizerName;
    private String organizerAvatar;
    private String organizerProfileLink;
    private String organizerContact;
}

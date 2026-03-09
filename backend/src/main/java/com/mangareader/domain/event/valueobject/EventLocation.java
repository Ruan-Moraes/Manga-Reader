package com.mangareader.domain.event.valueobject;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Localização de um evento (embeddable JPA).
 * <p>
 * Compatível com o frontend ({@code EventData.location} em event.types.ts).
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventLocation {

    private String label;
    private String address;
    private String city;
    private boolean isOnline;
    private String mapLink;
    private String directions;
}

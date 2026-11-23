package com.toonlira.application.event.port;

import com.toonlira.domain.event.valueobject.EventOrganizer;

public interface EventOrganizerRepositoryPort {
    EventOrganizer findOrCreate(EventOrganizer organizer);
}

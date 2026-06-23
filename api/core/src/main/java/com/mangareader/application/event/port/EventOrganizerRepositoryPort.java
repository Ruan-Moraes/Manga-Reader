package com.mangareader.application.event.port;

import com.mangareader.domain.event.valueobject.EventOrganizer;

public interface EventOrganizerRepositoryPort {
    EventOrganizer findOrCreate(EventOrganizer organizer);
}

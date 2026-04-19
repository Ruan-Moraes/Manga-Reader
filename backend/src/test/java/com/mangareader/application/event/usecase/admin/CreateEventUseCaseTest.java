package com.mangareader.application.event.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateEventUseCase")
class CreateEventUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private CreateEventUseCase createEventUseCase;

    @Test
    @DisplayName("Deve criar evento com todos os campos")
    void deveCriarEventoComTodosCampos() {
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        LocalDateTime start = LocalDateTime.of(2026, 5, 1, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 5, 3, 18, 0);
        EventLocation location = EventLocation.builder().label("Centro de Convenções").city("São Paulo").build();
        EventOrganizer organizer = EventOrganizer.builder().organizerName("MangaCon").build();

        Event result = createEventUseCase.execute(
                "Anime Expo", "Subtitle", "Description", "image.jpg",
                start, end, "America/Sao_Paulo",
                EventTimeline.UPCOMING, EventStatus.COMING_SOON, EventType.CONVENCAO,
                location, organizer, "R$ 50,00", true,
                List.of("10h - Abertura"), List.of("Guest 1")
        );

        assertThat(result.getTitle()).isEqualTo("Anime Expo");
        assertThat(result.getTimeline()).isEqualTo(EventTimeline.UPCOMING);
        assertThat(result.getLocation().getCity()).isEqualTo("São Paulo");
        assertThat(result.isFeatured()).isTrue();
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    @DisplayName("Deve criar evento com listas null tratadas como vazias")
    void deveCriarEventoComListasNull() {
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        Event result = createEventUseCase.execute(
                "Test", null, null, null,
                LocalDateTime.now(), LocalDateTime.now().plusDays(1), null,
                EventTimeline.UPCOMING, EventStatus.COMING_SOON, EventType.MEETUP,
                null, null, null, false, null, null
        );

        assertThat(result.getSchedule()).isEmpty();
        assertThat(result.getSpecialGuests()).isEmpty();
    }
}

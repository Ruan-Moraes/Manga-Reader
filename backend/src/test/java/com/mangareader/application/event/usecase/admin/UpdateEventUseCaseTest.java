package com.mangareader.application.event.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateEventUseCase")
class UpdateEventUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private UpdateEventUseCase updateEventUseCase;

    private final UUID EVENT_ID = UUID.randomUUID();

    private Event buildEvent() {
        return Event.builder()
                .id(EVENT_ID)
                .title("Original Event")
                .startDate(LocalDateTime.of(2026, 5, 1, 10, 0))
                .endDate(LocalDateTime.of(2026, 5, 3, 18, 0))
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.CONVENCAO)
                .build();
    }

    @Test
    @DisplayName("Deve atualizar apenas campos não-null")
    void deveAtualizarApenasCamposNaoNull() {
        Event event = buildEvent();
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        Event result = updateEventUseCase.execute(
                EVENT_ID, "Updated Title", null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null
        );

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getTimeline()).isEqualTo(EventTimeline.UPCOMING);
        assertThat(result.getStatus()).isEqualTo(EventStatus.COMING_SOON);
        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("Deve atualizar status e timeline")
    void deveAtualizarStatusETimeline() {
        Event event = buildEvent();
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        Event result = updateEventUseCase.execute(
                EVENT_ID, null, null, null, null,
                null, null, null,
                EventTimeline.ONGOING, EventStatus.HAPPENING_NOW, null,
                null, null, null, null, null, null
        );

        assertThat(result.getTimeline()).isEqualTo(EventTimeline.ONGOING);
        assertThat(result.getStatus()).isEqualTo(EventStatus.HAPPENING_NOW);
    }

    @Test
    @DisplayName("Deve lançar exceção quando evento não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        UUID invalidId = UUID.randomUUID();
        when(eventRepository.findById(invalidId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateEventUseCase.execute(
                invalidId, "Title", null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Event");
    }
}

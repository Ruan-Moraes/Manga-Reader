package com.toonlira.application.event.usecase.admin;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.toonlira.application.event.port.EventRepositoryPort;
import com.toonlira.domain.event.entity.Event;
import com.toonlira.domain.event.valueobject.EventStatus;
import com.toonlira.domain.event.valueobject.EventTimeline;
import com.toonlira.domain.event.valueobject.EventType;
import com.toonlira.shared.exception.ResourceNotFoundException;

import java.time.LocalDateTime;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteEventUseCase")
class DeleteEventUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private DeleteEventUseCase deleteEventUseCase;

    private final UUID EVENT_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve excluir evento existente")
    void deveExcluirEventoExistente() {
        Event event = Event.builder()
                .id(EVENT_ID)
                .title(com.toonlira.shared.domain.i18n.LocalizedString.ofDefault("Test Event"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(1))
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.MEETUP)
                .build();
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

        deleteEventUseCase.execute(EVENT_ID);

        verify(eventRepository).deleteById(EVENT_ID);
    }

    @Test
    @DisplayName("Deve lançar exceção quando evento não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        UUID invalidId = UUID.randomUUID();
        when(eventRepository.findById(invalidId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteEventUseCase.execute(invalidId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Event");
    }
}

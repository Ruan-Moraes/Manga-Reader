package com.mangareader.application.event.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
@DisplayName("GetEventByIdUseCase")
class GetEventByIdUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private GetEventByIdUseCase getEventByIdUseCase;

    @Test
    @DisplayName("Deve retornar evento quando encontrado")
    void deveRetornarEventoQuandoEncontrado() {
        // Arrange
        UUID eventId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .title("CCXP 2026")
                .status(EventStatus.REGISTRATIONS_OPEN)
                .timeline(EventTimeline.UPCOMING)
                .type(EventType.CONVENCAO)
                .startDate(LocalDateTime.of(2026, 12, 5, 10, 0))
                .endDate(LocalDateTime.of(2026, 12, 8, 22, 0))
                .build();
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // Act
        Event result = getEventByIdUseCase.execute(eventId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(eventId);
        assertThat(result.getTitle()).isEqualTo("CCXP 2026");
        assertThat(result.getStatus()).isEqualTo(EventStatus.REGISTRATIONS_OPEN);
        assertThat(result.getType()).isEqualTo(EventType.CONVENCAO);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando evento não existe")
    void deveLancarExcecaoQuandoEventoNaoExiste() {
        // Arrange
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> getEventByIdUseCase.execute(eventId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

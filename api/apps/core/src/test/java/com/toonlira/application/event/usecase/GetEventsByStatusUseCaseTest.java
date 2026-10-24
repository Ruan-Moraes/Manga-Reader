package com.toonlira.application.event.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.toonlira.application.event.port.EventRepositoryPort;
import com.toonlira.domain.event.entity.Event;
import com.toonlira.domain.event.valueobject.EventStatus;
import com.toonlira.domain.event.valueobject.EventTimeline;
import com.toonlira.domain.event.valueobject.EventType;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetEventsByStatusUseCase")
class GetEventsByStatusUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private GetEventsByStatusUseCase getEventsByStatusUseCase;

    @Test
    @DisplayName("Deve retornar eventos filtrados por status")
    void deveRetornarEventosFiltradosPorStatus() {
        // Arrange
        EventStatus status = EventStatus.HAPPENING_NOW;
        Pageable pageable = PageRequest.of(0, 10);
        List<Event> events = List.of(
                Event.builder()
                        .title(com.toonlira.shared.domain.i18n.LocalizedString.ofDefault("Maratona de Leitura"))
                        .status(status)
                        .timeline(EventTimeline.ONGOING)
                        .type(EventType.MEETUP)
                        .startDate(LocalDateTime.of(2026, 3, 10, 8, 0))
                        .endDate(LocalDateTime.of(2026, 3, 10, 23, 0))
                        .build()
        );
        Page<Event> page = new PageImpl<>(events, pageable, 1);
        when(eventRepository.findByStatus(status, pageable)).thenReturn(page);

        // Act
        Page<Event> result = getEventsByStatusUseCase.execute(status, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent()).allSatisfy(e ->
                assertThat(e.getStatus()).isEqualTo(EventStatus.HAPPENING_NOW));
    }

    @Test
    @DisplayName("Deve retornar página vazia quando status não tem eventos")
    void deveRetornarPaginaVaziaParaStatusSemEventos() {
        // Arrange
        EventStatus status = EventStatus.ENDED;
        Pageable pageable = PageRequest.of(0, 10);
        Page<Event> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(eventRepository.findByStatus(status, pageable)).thenReturn(emptyPage);

        // Act
        Page<Event> result = getEventsByStatusUseCase.execute(status, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}

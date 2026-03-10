package com.mangareader.application.event.usecase;

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

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetEventsUseCase")
class GetEventsUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private GetEventsUseCase getEventsUseCase;

    @Test
    @DisplayName("Deve retornar página com eventos")
    void deveRetornarPaginaComEventos() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<Event> events = List.of(
                Event.builder()
                        .title("Anime Friends 2026")
                        .status(EventStatus.COMING_SOON)
                        .timeline(EventTimeline.UPCOMING)
                        .type(EventType.CONVENCAO)
                        .startDate(LocalDateTime.of(2026, 7, 10, 10, 0))
                        .endDate(LocalDateTime.of(2026, 7, 13, 22, 0))
                        .build(),
                Event.builder()
                        .title("Live de Lançamento")
                        .status(EventStatus.HAPPENING_NOW)
                        .timeline(EventTimeline.ONGOING)
                        .type(EventType.LIVE)
                        .startDate(LocalDateTime.of(2026, 3, 10, 19, 0))
                        .endDate(LocalDateTime.of(2026, 3, 10, 21, 0))
                        .build()
        );
        Page<Event> page = new PageImpl<>(events, pageable, 2);
        when(eventRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Event> result = getEventsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há eventos")
    void deveRetornarPaginaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Event> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(eventRepository.findAll(pageable)).thenReturn(emptyPage);

        // Act
        Page<Event> result = getEventsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}

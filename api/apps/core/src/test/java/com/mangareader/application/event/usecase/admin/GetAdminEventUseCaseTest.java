package com.mangareader.application.event.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetAdminEventUseCase")
class GetAdminEventUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private GetAdminEventUseCase useCase;

    @Test
    @DisplayName("Retorna evento quando encontrado")
    void retornaQuandoEncontrado() {
        UUID id = UUID.randomUUID();
        Event event = mock(Event.class);
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));

        assertThat(useCase.execute(id)).isSameAs(event);
    }

    @Test
    @DisplayName("Lança ResourceNotFoundException quando ausente")
    void lancaQuandoAusente() {
        UUID id = UUID.randomUUID();
        when(eventRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("HideActivityEventUseCase")
class HideActivityEventUseCaseTest {

    @Mock
    private ActivityEventRepositoryPort activityEventRepository;

    @InjectMocks
    private HideActivityEventUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String EVENT_ID = "event-1";

    @Test
    @DisplayName("Deve ocultar evento que pertence ao usuário")
    void deveOcultarEventoDoUsuario() {
        when(activityEventRepository.hide(EVENT_ID, USER_ID.toString())).thenReturn(true);

        useCase.execute(USER_ID, EVENT_ID);

        verify(activityEventRepository).hide(EVENT_ID, USER_ID.toString());
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando evento não existe ou não pertence ao usuário")
    void deveLancarQuandoEventoNaoPertenceAoUsuario() {
        when(activityEventRepository.hide(EVENT_ID, USER_ID.toString())).thenReturn(false);

        assertThatThrownBy(() -> useCase.execute(USER_ID, EVENT_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserSystemSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSystemSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingDirection;
import com.mangareader.mock.user.UserMock;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserSettingsUseCase")
class GetUserSettingsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserSystemSettingsResolver systemSettingsResolver;

    @InjectMocks
    private GetUserSettingsUseCase useCase;

    @Test
    @DisplayName("Deve retornar configurações de sistema do usuário")
    void deveRetornarConfiguracoes() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        UserSystemSettings settings = UserSystemSettings.defaults(user);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(systemSettingsResolver.getOrCreate(user)).thenReturn(settings);

        var result = useCase.execute(userId);

        assertThat(result.reader().direction()).isEqualTo(ReadingDirection.RTL);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
    void deveLancarQuandoUsuarioNaoExiste() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import com.mangareader.application.user.port.UserSystemSettingsRepositoryPort;
import com.mangareader.application.user.service.UserSystemSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSystemSettings;
import com.mangareader.domain.user.valueobject.UserSettings;
import com.mangareader.domain.user.valueobject.UserSettings.AppearanceSettings;
import com.mangareader.domain.user.valueobject.UserSettings.DateFormatPreference;
import com.mangareader.domain.user.valueobject.UserSettings.DensityPreference;
import com.mangareader.domain.user.valueobject.UserSettings.FontSizePreference;
import com.mangareader.domain.user.valueobject.UserSettings.LocaleSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReaderSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingDirection;
import com.mangareader.domain.user.valueobject.UserSettings.ThemePreference;
import com.mangareader.mock.user.UserMock;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateUserSettingsUseCase")
class UpdateUserSettingsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserSystemSettingsResolver systemSettingsResolver;

    @Mock
    private UserSystemSettingsRepositoryPort systemSettingsRepository;

    @InjectMocks
    private UpdateUserSettingsUseCase useCase;

    private UserSettings sample() {
        var reader = new ReaderSettings(
                ReadingDirection.LTR,
                UserSettings.ReadingMode.PAGED,
                UserSettings.ReadingFit.HEIGHT,
                UserSettings.ImageQuality.HIGH,
                16,
                UserSettings.ReaderBackground.PAPER,
                false,
                5);
        var appearance = new AppearanceSettings(ThemePreference.SYSTEM, FontSizePreference.COMFORTABLE, DensityPreference.COMPACT, false);
        var locale = new LocaleSettings(DateFormatPreference.MON_D, "UTC");
        var a11y = new UserSettings.AccessibilitySettings(true, false);

        return new UserSettings(reader, appearance, locale, a11y);
    }

    @Test
    @DisplayName("Deve atualizar as configurações do usuário")
    void deveAtualizar() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        UserSystemSettings systemSettings = UserSystemSettings.defaults(user);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(systemSettingsResolver.getOrCreate(user)).thenReturn(systemSettings);
        when(systemSettingsRepository.save(any(UserSystemSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        UserSettings result = useCase.execute(userId, sample());

        assertThat(result.reader().direction()).isEqualTo(ReadingDirection.LTR);
        assertThat(result.reader().gap()).isEqualTo(16);
        assertThat(result.locale().timezone()).isEqualTo("UTC");
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
    void deveLancarQuandoUsuarioNaoExiste() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId, sample()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve propagar IllegalArgumentException quando settings é nulo")
    void deveRejeitarSettingsNulo() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> useCase.execute(userId, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

package com.mangareader.domain.user.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.valueobject.UserSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingDirection;
import com.mangareader.mock.user.UserMock;

@DisplayName("UserSystemSettings")
class UserSystemSettingsTest {

    @Test
    @DisplayName("defaults() deve criar configurações de sistema padrão para o usuário")
    void defaults() {
        User user = UserMock.withId(UUID.randomUUID());

        UserSystemSettings settings = UserSystemSettings.defaults(user);

        assertThat(settings.getUser()).isEqualTo(user);
        assertThat(settings.toSettings().reader().direction()).isEqualTo(ReadingDirection.RTL);
    }

    @Test
    @DisplayName("Deve atualizar configurações quando payload é válido")
    void deveAtualizarSettings() {
        UserSystemSettings settings = UserSystemSettings.defaults(UserMock.withId(UUID.randomUUID()));

        settings.updateSettings(UserSettings.defaults());

        assertThat(settings.toSettings()).isEqualTo(UserSettings.defaults());
    }

    @Test
    @DisplayName("Deve rejeitar settings nulo")
    void deveRejeitarSettingsNulo() {
        UserSystemSettings settings = UserSystemSettings.defaults(UserMock.withId(UUID.randomUUID()));

        assertThatThrownBy(() -> settings.updateSettings(null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

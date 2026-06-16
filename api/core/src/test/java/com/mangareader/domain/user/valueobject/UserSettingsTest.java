package com.mangareader.domain.user.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.user.valueobject.UserSettings.AccessibilitySettings;
import com.mangareader.domain.user.valueobject.UserSettings.AppearanceSettings;
import com.mangareader.domain.user.valueobject.UserSettings.DateFormatPreference;
import com.mangareader.domain.user.valueobject.UserSettings.DensityPreference;
import com.mangareader.domain.user.valueobject.UserSettings.FontSizePreference;
import com.mangareader.domain.user.valueobject.UserSettings.ImageQuality;
import com.mangareader.domain.user.valueobject.UserSettings.LocaleSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReaderBackground;
import com.mangareader.domain.user.valueobject.UserSettings.ReaderSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingDirection;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingFit;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingMode;
import com.mangareader.domain.user.valueobject.UserSettings.ThemePreference;

@DisplayName("UserSettings")
class UserSettingsTest {

    @Test
    @DisplayName("defaults() deve usar leitura da direita para a esquerda e tema escuro")
    void defaults() {
        UserSettings s = UserSettings.defaults();

        assertThat(s.reader().direction()).isEqualTo(ReadingDirection.RTL);
        assertThat(s.reader().gap()).isEqualTo(8);
        assertThat(s.appearance().theme()).isEqualTo(ThemePreference.DARK);
        assertThat(s.locale().dateFormat()).isEqualTo(DateFormatPreference.D_MON);
    }

    @Test
    @DisplayName("Deve rejeitar gap fora de 0–32")
    void deveRejeitarGapForaDoIntervalo() {
        assertThatThrownBy(() -> new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 64, ReaderBackground.DARK, true, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar preload fora de 0–10")
    void deveRejeitarPreloadForaDoIntervalo() {
        assertThatThrownBy(() -> new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 8, ReaderBackground.DARK, true, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar enum nulo no leitor")
    void deveRejeitarEnumNulo() {
        assertThatThrownBy(() -> new ReaderSettings(null, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 8, ReaderBackground.DARK, true, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar timezone em branco")
    void deveRejeitarTimezoneEmBranco() {
        assertThatThrownBy(() -> new LocaleSettings(DateFormatPreference.D_MON, "  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar grupo nulo no agregado")
    void deveRejeitarGrupoNulo() {
        var appearance = new AppearanceSettings(ThemePreference.DARK, FontSizePreference.DEFAULT, DensityPreference.COMFORTABLE, true);
        var locale = new LocaleSettings(DateFormatPreference.D_MON, "UTC");
        var a11y = new AccessibilitySettings(false, false, false);

        assertThatThrownBy(() -> new UserSettings(null, appearance, locale, a11y))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

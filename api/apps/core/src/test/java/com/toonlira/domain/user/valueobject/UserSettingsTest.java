package com.toonlira.domain.user.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.toonlira.domain.user.valueobject.UserSettings.AccessibilitySettings;
import com.toonlira.domain.user.valueobject.UserSettings.AppearanceSettings;
import com.toonlira.domain.user.valueobject.UserSettings.DateFormatPreference;
import com.toonlira.domain.user.valueobject.UserSettings.DensityPreference;
import com.toonlira.domain.user.valueobject.UserSettings.FontSizePreference;
import com.toonlira.domain.user.valueobject.UserSettings.ImageQuality;
import com.toonlira.domain.user.valueobject.UserSettings.LocaleSettings;
import com.toonlira.domain.user.valueobject.UserSettings.ReaderBackground;
import com.toonlira.domain.user.valueobject.UserSettings.ReaderSettings;
import com.toonlira.domain.user.valueobject.UserSettings.ReadingDirection;
import com.toonlira.domain.user.valueobject.UserSettings.ReadingFit;
import com.toonlira.domain.user.valueobject.UserSettings.ReadingMode;
import com.toonlira.domain.user.valueobject.UserSettings.ThemePreference;

@DisplayName("UserSettings")
class UserSettingsTest {

    @Test
    @DisplayName("defaults() deve usar leitura da direita para a esquerda e tema escuro")
    void defaults() {
        UserSettings s = UserSettings.defaults();

        assertThat(s.reader().direction()).isEqualTo(ReadingDirection.RTL);
        assertThat(s.reader().gap()).isZero();
        assertThat(s.reader().saturation()).isEqualTo(100);
        assertThat(s.appearance().theme()).isEqualTo(ThemePreference.DARK);
        assertThat(s.locale().dateFormat()).isEqualTo(DateFormatPreference.D_MON);
    }

    @Test
    @DisplayName("Deve disponibilizar fundos claros para o leitor")
    void deveDisponibilizarFundosClaros() {
        assertThat(ReaderBackground.values()).contains(ReaderBackground.LIGHT, ReaderBackground.WHITE);
    }

    @Test
    @DisplayName("Deve rejeitar gap fora de 0–32")
    void deveRejeitarGapForaDoIntervalo() {
        assertThatThrownBy(() -> new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 100, 64, ReaderBackground.DARK, true, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar saturação fora de 0–100")
    void deveRejeitarSaturacaoForaDoIntervalo() {
        assertThatThrownBy(() -> new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 101, 0, ReaderBackground.DARK, true, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve aceitar saturação mínima e máxima")
    void deveAceitarExtremosDeSaturacao() {
        assertThat(new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 0, 0, ReaderBackground.DARK, true, 3).saturation()).isZero();
        assertThat(new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 100, 0, ReaderBackground.DARK, true, 3).saturation()).isEqualTo(100);
    }

    @Test
    @DisplayName("Deve rejeitar preload fora de 0–10")
    void deveRejeitarPreloadForaDoIntervalo() {
        assertThatThrownBy(() -> new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 100, 8, ReaderBackground.DARK, true, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar enum nulo no leitor")
    void deveRejeitarEnumNulo() {
        assertThatThrownBy(() -> new ReaderSettings(null, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 100, 8, ReaderBackground.DARK, true, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar timezone em branco")
    void deveRejeitarTimezoneEmBranco() {
        assertThatThrownBy(() -> new LocaleSettings(DateFormatPreference.D_MON, "  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar timezone inválido")
    void deveRejeitarTimezoneInvalido() {
        assertThatThrownBy(() -> new LocaleSettings(DateFormatPreference.D_MON, "America/Invalid"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve rejeitar grupo nulo no agregado")
    void deveRejeitarGrupoNulo() {
        var appearance = new AppearanceSettings(ThemePreference.DARK, FontSizePreference.DEFAULT, DensityPreference.COMFORTABLE, true);
        var locale = new LocaleSettings(DateFormatPreference.D_MON, "UTC");
        var a11y = new AccessibilitySettings(false, false);

        assertThatThrownBy(() -> new UserSettings(null, appearance, locale, a11y))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

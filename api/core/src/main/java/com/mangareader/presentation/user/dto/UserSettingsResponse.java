package com.mangareader.presentation.user.dto;

import com.mangareader.domain.user.valueobject.UserSettings;

/**
 * Resposta com as preferências do sistema do usuário. Espelha {@code UserSettings} para não expor o VO
 * de domínio diretamente na camada de apresentação.
 */
public record UserSettingsResponse(Reader reader, Appearance appearance, Locale locale, Accessibility accessibility) {
    public record Reader(String direction, String mode, String fit, String quality, int gap, String background, boolean autoMarkRead, int preload) {}

    public record Appearance(String theme, String fontSize, String density, boolean animations) {}

    public record Locale(String dateFormat, String timezone) {}

    public record Accessibility(boolean reduceMotion, boolean highContrast) {}

    public static UserSettingsResponse from(UserSettings s) {
        var r = s.reader();
        var a = s.appearance();
        var l = s.locale();
        var ac = s.accessibility();

        return new UserSettingsResponse(
                new Reader(r.direction().name(), r.mode().name(), r.fit().name(), r.quality().name(), r.gap(), r.background().name(), r.autoMarkRead(), r.preload()),
                new Appearance(a.theme().name(), a.fontSize().name(), a.density().name(), a.animations()),
                new Locale(l.dateFormat().name(), l.timezone()),
                new Accessibility(ac.reduceMotion(), ac.highContrast()));
    }
}

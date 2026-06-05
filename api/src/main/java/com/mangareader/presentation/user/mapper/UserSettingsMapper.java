package com.mangareader.presentation.user.mapper;

import com.mangareader.domain.user.valueobject.UserSettings;
import com.mangareader.domain.user.valueobject.UserSettings.AccessibilitySettings;
import com.mangareader.domain.user.valueobject.UserSettings.AppearanceSettings;
import com.mangareader.domain.user.valueobject.UserSettings.LocaleSettings;
import com.mangareader.domain.user.valueobject.UserSettings.ReaderSettings;
import com.mangareader.presentation.user.dto.UpdateUserSettingsRequest;

/**
 * Converte o payload de apresentação no value object de domínio. Mapper puro (sem dependências),
 * portanto estático — segue a regra do projeto para mappers sem serviços injetados.
 */
public final class UserSettingsMapper {
    private UserSettingsMapper() {}

    public static UserSettings toDomain(UpdateUserSettingsRequest req) {
        var r = req.reader();
        var a = req.appearance();
        var l = req.locale();
        var ac = req.accessibility();

        return new UserSettings(
                new ReaderSettings(r.direction(), r.mode(), r.fit(), r.quality(), r.gap(), r.background(), r.autoMarkRead(), r.preload()),
                new AppearanceSettings(a.theme(), a.fontSize(), a.density(), a.animations()),
                new LocaleSettings(l.dateFormat(), l.timezone()),
                new AccessibilitySettings(ac.reduceMotion(), ac.highContrast(), ac.captions()));
    }
}

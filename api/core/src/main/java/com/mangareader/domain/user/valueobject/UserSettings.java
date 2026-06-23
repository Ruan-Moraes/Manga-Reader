package com.mangareader.domain.user.valueobject;

import java.util.Set;

/**
 * Preferências globais do sistema (não-perfil) do usuário.
 *
 * <p>Agrupa leitor, aparência, idioma/região (apenas formato de data e fuso — o idioma da interface
 * é client-only e os idiomas de leitura vivem em {@code contentLocales}) e acessibilidade. É um value
 * object imutável e auto-validável: ranges e enums inválidos lançam {@link IllegalArgumentException}.
 */
public record UserSettings(
        ReaderSettings reader,
        AppearanceSettings appearance,
        LocaleSettings locale,
        AccessibilitySettings accessibility
) {
    public static final Set<String> SUPPORTED_TIMEZONES = Set.of(
            "America/Sao_Paulo",
            "America/New_York",
            "Europe/Lisbon",
            "Asia/Tokyo",
            "UTC"
    );

    public UserSettings {
        if (reader == null || appearance == null || locale == null || accessibility == null) {
            throw new IllegalArgumentException("settings groups must not be null");
        }
    }

    public static UserSettings defaults() {
        return new UserSettings(ReaderSettings.defaults(), AppearanceSettings.defaults(), LocaleSettings.defaults(), AccessibilitySettings.defaults());
    }

    public record ReaderSettings(
            ReadingDirection direction,
            ReadingMode mode,
            ReadingFit fit,
            ImageQuality quality,
            int gap,
            ReaderBackground background,
            boolean autoMarkRead,
            int preload
    ) {
        public static final int GAP_MIN = 0;
        public static final int GAP_MAX = 32;
        public static final int PRELOAD_MIN = 0;
        public static final int PRELOAD_MAX = 10;

        public ReaderSettings {
            if (direction == null || mode == null || fit == null || quality == null || background == null) {
                throw new IllegalArgumentException("reader enums must not be null");
            }
            if (gap < GAP_MIN || gap > GAP_MAX) {
                throw new IllegalArgumentException("reader gap must be between " + GAP_MIN + " and " + GAP_MAX);
            }
            if (preload < PRELOAD_MIN || preload > PRELOAD_MAX) {
                throw new IllegalArgumentException("reader preload must be between " + PRELOAD_MIN + " and " + PRELOAD_MAX);
            }
        }

        public static ReaderSettings defaults() {
            return new ReaderSettings(ReadingDirection.RTL, ReadingMode.VERTICAL, ReadingFit.WIDTH, ImageQuality.AUTO, 8, ReaderBackground.DARK, true, 3);
        }
    }

    public record AppearanceSettings(ThemePreference theme, FontSizePreference fontSize, DensityPreference density, boolean animations) {
        public AppearanceSettings {
            if (theme == null || fontSize == null || density == null) {
                throw new IllegalArgumentException("appearance enums must not be null");
            }
        }

        public static AppearanceSettings defaults() {
            return new AppearanceSettings(ThemePreference.DARK, FontSizePreference.DEFAULT, DensityPreference.COMFORTABLE, true);
        }
    }

    public record LocaleSettings(DateFormatPreference dateFormat, String timezone) {
        public LocaleSettings {
            if (dateFormat == null) {
                throw new IllegalArgumentException("dateFormat must not be null");
            }
            if (timezone == null || timezone.isBlank()) {
                throw new IllegalArgumentException("timezone must not be blank");
            }
            if (!SUPPORTED_TIMEZONES.contains(timezone)) {
                throw new IllegalArgumentException("timezone is not supported");
            }
        }

        public static LocaleSettings defaults() {
            return new LocaleSettings(DateFormatPreference.D_MON, "America/Sao_Paulo");
        }
    }

    public record AccessibilitySettings(boolean reduceMotion, boolean highContrast) {
        public static AccessibilitySettings defaults() {
            return new AccessibilitySettings(false, false);
        }
    }

    public enum ReadingDirection {
        LTR,
        RTL,
        WEBTOON
    }

    public enum ReadingMode {
        VERTICAL,
        PAGED,
        DOUBLE
    }

    public enum ReadingFit {
        WIDTH,
        HEIGHT,
        ORIGINAL
    }

    public enum ImageQuality {
        AUTO,
        LOW,
        MEDIUM,
        HIGH,
        ORIGINAL
    }

    public enum ReaderBackground {
        BLACK,
        DARK,
        PAPER
    }

    public enum ThemePreference {
        DARK,
        LIGHT,
        SYSTEM
    }

    public enum FontSizePreference {
        COMPACT,
        DEFAULT,
        COMFORTABLE
    }

    public enum DensityPreference {
        COMFORTABLE,
        COMPACT
    }

    public enum DateFormatPreference {
        D_MON,
        D_M,
        MON_D
    }
}

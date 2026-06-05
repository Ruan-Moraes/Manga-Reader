package com.mangareader.presentation.user.dto;

import com.mangareader.domain.user.valueobject.UserSettings.DateFormatPreference;
import com.mangareader.domain.user.valueobject.UserSettings.DensityPreference;
import com.mangareader.domain.user.valueobject.UserSettings.FontSizePreference;
import com.mangareader.domain.user.valueobject.UserSettings.ImageQuality;
import com.mangareader.domain.user.valueobject.UserSettings.ReaderBackground;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingDirection;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingFit;
import com.mangareader.domain.user.valueobject.UserSettings.ReadingMode;
import com.mangareader.domain.user.valueobject.UserSettings.ThemePreference;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Payload de atualização das preferências do sistema. Espelha {@code UserSettings} com validação de
 * ranges e enums (Bean Validation) para retornar 400 antes de tocar o domínio.
 */
public record UpdateUserSettingsRequest(
        @NotNull(message = "{validation.settings.required}") @Valid Reader reader,
        @NotNull(message = "{validation.settings.required}") @Valid Appearance appearance,
        @NotNull(message = "{validation.settings.required}") @Valid Locale locale,
        @NotNull(message = "{validation.settings.required}") @Valid Accessibility accessibility
) {
    public record Reader(
            @NotNull(message = "{validation.settings.required}") ReadingDirection direction,
            @NotNull(message = "{validation.settings.required}") ReadingMode mode,
            @NotNull(message = "{validation.settings.required}") ReadingFit fit,
            @NotNull(message = "{validation.settings.required}") ImageQuality quality,
            @Min(value = 0, message = "{validation.settings.range}") @Max(value = 32, message = "{validation.settings.range}") int gap,
            @NotNull(message = "{validation.settings.required}") ReaderBackground background,
            boolean autoMarkRead,
            @Min(value = 0, message = "{validation.settings.range}") @Max(value = 10, message = "{validation.settings.range}") int preload
    ) {}

    public record Appearance(
            @NotNull(message = "{validation.settings.required}") ThemePreference theme,
            @NotNull(message = "{validation.settings.required}") FontSizePreference fontSize,
            @NotNull(message = "{validation.settings.required}") DensityPreference density,
            boolean animations
    ) {}

    public record Locale(
            @NotNull(message = "{validation.settings.required}") DateFormatPreference dateFormat,
            @NotBlank(message = "{validation.settings.required}") String timezone
    ) {}

    public record Accessibility(boolean reduceMotion, boolean highContrast, boolean captions) {}
}

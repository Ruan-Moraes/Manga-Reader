package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.mangareader.domain.user.valueobject.UserSettings;
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

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Configurações globais do sistema do usuário (PostgreSQL).
 */
@Entity
@Table(name = "user_system_settings")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSystemSettings {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "reader_direction", nullable = false, length = 20)
    @Builder.Default
    private ReadingDirection readerDirection = ReadingDirection.RTL;

    @Enumerated(EnumType.STRING)
    @Column(name = "reader_mode", nullable = false, length = 20)
    @Builder.Default
    private ReadingMode readerMode = ReadingMode.VERTICAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "reader_fit", nullable = false, length = 20)
    @Builder.Default
    private ReadingFit readerFit = ReadingFit.WIDTH;

    @Enumerated(EnumType.STRING)
    @Column(name = "reader_quality", nullable = false, length = 20)
    @Builder.Default
    private ImageQuality readerQuality = ImageQuality.AUTO;

    @Column(name = "reader_gap", nullable = false)
    @Builder.Default
    private int readerGap = 8;

    @Enumerated(EnumType.STRING)
    @Column(name = "reader_background", nullable = false, length = 20)
    @Builder.Default
    private ReaderBackground readerBackground = ReaderBackground.DARK;

    @Column(name = "auto_mark_read", nullable = false)
    @Builder.Default
    private boolean autoMarkRead = true;

    @Column(name = "preload_pages", nullable = false)
    @Builder.Default
    private int preloadPages = 3;

    @Enumerated(EnumType.STRING)
    @Column(name = "appearance_theme", nullable = false, length = 20)
    @Builder.Default
    private ThemePreference appearanceTheme = ThemePreference.DARK;

    @Enumerated(EnumType.STRING)
    @Column(name = "font_size", nullable = false, length = 20)
    @Builder.Default
    private FontSizePreference fontSize = FontSizePreference.DEFAULT;

    @Enumerated(EnumType.STRING)
    @Column(name = "density", nullable = false, length = 20)
    @Builder.Default
    private DensityPreference density = DensityPreference.COMFORTABLE;

    @Column(name = "animations_enabled", nullable = false)
    @Builder.Default
    private boolean animationsEnabled = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "date_format", nullable = false, length = 20)
    @Builder.Default
    private DateFormatPreference dateFormat = DateFormatPreference.D_MON;

    @Column(name = "timezone", nullable = false, length = 100)
    @Builder.Default
    private String timezone = "America/Sao_Paulo";

    @Column(name = "reduce_motion", nullable = false)
    @Builder.Default
    private boolean reduceMotion = false;

    @Column(name = "high_contrast", nullable = false)
    @Builder.Default
    private boolean highContrast = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static UserSystemSettings defaults(User user) {
        return UserSystemSettings.builder()
                .user(user)
                .build();
    }

    public UserSettings toSettings() {
        return new UserSettings(
                new ReaderSettings(
                        readerDirection,
                        readerMode,
                        readerFit,
                        readerQuality,
                        readerGap,
                        readerBackground,
                        autoMarkRead,
                        preloadPages),
                new AppearanceSettings(
                        appearanceTheme,
                        fontSize,
                        density,
                        animationsEnabled),
                new LocaleSettings(
                        dateFormat,
                        timezone),
                new AccessibilitySettings(
                        reduceMotion,
                        highContrast));
    }

    public void updateSettings(UserSettings settings) {
        if (settings == null) {
            throw new IllegalArgumentException("settings must not be null");
        }

        ReaderSettings reader = settings.reader();
        AppearanceSettings appearance = settings.appearance();
        LocaleSettings locale = settings.locale();
        AccessibilitySettings accessibility = settings.accessibility();

        this.readerDirection = reader.direction();
        this.readerMode = reader.mode();
        this.readerFit = reader.fit();
        this.readerQuality = reader.quality();
        this.readerGap = reader.gap();
        this.readerBackground = reader.background();
        this.autoMarkRead = reader.autoMarkRead();
        this.preloadPages = reader.preload();
        this.appearanceTheme = appearance.theme();
        this.fontSize = appearance.fontSize();
        this.density = appearance.density();
        this.animationsEnabled = appearance.animations();
        this.dateFormat = locale.dateFormat();
        this.timezone = locale.timezone();
        this.reduceMotion = accessibility.reduceMotion();
        this.highContrast = accessibility.highContrast();
    }
}

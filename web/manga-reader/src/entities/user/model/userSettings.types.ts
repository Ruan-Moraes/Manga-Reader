// Preferências globais do sistema (não-perfil). Espelha o VO UserSettings do api.

export type ReadingDirection = 'LTR' | 'RTL' | 'WEBTOON';
export type ReadingMode = 'VERTICAL' | 'PAGED' | 'DOUBLE';
export type ReadingFit = 'WIDTH' | 'HEIGHT' | 'ORIGINAL';
export type ImageQuality = 'AUTO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ORIGINAL';
export type ReaderBackground = 'BLACK' | 'DARK' | 'PAPER';
export type ThemePreference = 'DARK' | 'LIGHT' | 'SYSTEM';
export type FontSizePreference = 'COMPACT' | 'DEFAULT' | 'COMFORTABLE';
export type DensityPreference = 'COMFORTABLE' | 'COMPACT';
export type DateFormatPreference = 'D_MON' | 'D_M' | 'MON_D';

export interface ReaderSettings {
    direction: ReadingDirection;
    mode: ReadingMode;
    fit: ReadingFit;
    quality: ImageQuality;
    gap: number;
    background: ReaderBackground;
    autoMarkRead: boolean;
    preload: number;
}

export interface AppearanceSettings {
    theme: ThemePreference;
    fontSize: FontSizePreference;
    density: DensityPreference;
    animations: boolean;
}

export interface LocaleSettings {
    dateFormat: DateFormatPreference;
    timezone: string;
}

export interface AccessibilitySettings {
    reduceMotion: boolean;
    highContrast: boolean;
    captions: boolean;
}

export interface UserSettings {
    reader: ReaderSettings;
    appearance: AppearanceSettings;
    locale: LocaleSettings;
    accessibility: AccessibilitySettings;
}

/** Espelha UserSettings.defaults() do api — usado para hidratação offline/deslogado. */
export const DEFAULT_USER_SETTINGS: UserSettings = {
    reader: { direction: 'RTL', mode: 'VERTICAL', fit: 'WIDTH', quality: 'AUTO', gap: 8, background: 'DARK', autoMarkRead: true, preload: 3 },
    appearance: { theme: 'DARK', fontSize: 'DEFAULT', density: 'COMFORTABLE', animations: true },
    locale: { dateFormat: 'D_MON', timezone: 'America/Sao_Paulo' },
    accessibility: { reduceMotion: false, highContrast: false, captions: false },
};

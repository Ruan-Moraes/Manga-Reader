import {
    type DateFormatPreference,
    DEFAULT_DATE_FORMAT,
    DEFAULT_TIMEZONE,
    normalizeDateFormat,
    normalizeTimezone,
    type SupportedTimezone,
} from '@/src/shared/locale';
import type { DensityPreference, FontSizePreference, ThemePreference } from '@/src/shared/theme';

export type ReadingDirection = 'LTR' | 'RTL' | 'WEBTOON';
export type ReadingMode = 'VERTICAL' | 'PAGED' | 'DOUBLE';
export type ReadingFit = 'WIDTH' | 'HEIGHT' | 'ORIGINAL';
export type ImageQuality = 'AUTO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ORIGINAL';
export type ReaderBackground = 'BLACK' | 'DARK' | 'PAPER' | 'LIGHT' | 'WHITE';
export type { DateFormatPreference, SupportedTimezone } from '@/src/shared/locale';
export type { DensityPreference, FontSizePreference, ThemePreference } from '@/src/shared/theme';
export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export interface ReaderSettings {
    direction: ReadingDirection;
    mode: ReadingMode;
    fit: ReadingFit;
    quality: ImageQuality;
    saturation: number;
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
    timezone: SupportedTimezone;
}

export interface AccessibilitySettings {
    reduceMotion: boolean;
    highContrast: boolean;
}

export interface UserSettings {
    reader: ReaderSettings;
    appearance: AppearanceSettings;
    locale: LocaleSettings;
    accessibility: AccessibilitySettings;
}

export const SETTINGS_ENVELOPE_VERSION = 2;

export function themePreferenceToColorScheme(theme: ThemePreference): 'dark' | 'light' | null {
    if (theme === 'DARK') return 'dark';
    if (theme === 'LIGHT') return 'light';
    return null;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
    reader: {
        direction: 'RTL',
        mode: 'VERTICAL',
        fit: 'WIDTH',
        quality: 'AUTO',
        saturation: 100,
        gap: 0,
        background: 'DARK',
        autoMarkRead: true,
        preload: 3,
    },
    appearance: {
        theme: 'SYSTEM',
        fontSize: 'DEFAULT',
        density: 'COMFORTABLE',
        animations: true,
    },
    locale: {
        dateFormat: DEFAULT_DATE_FORMAT,
        timezone: DEFAULT_TIMEZONE,
    },
    accessibility: {
        reduceMotion: false,
        highContrast: false,
    },
};

const DIRECTIONS = ['LTR', 'RTL', 'WEBTOON'] as const;
const MODES = ['VERTICAL', 'PAGED', 'DOUBLE'] as const;
const FITS = ['WIDTH', 'HEIGHT', 'ORIGINAL'] as const;
const QUALITIES = ['AUTO', 'LOW', 'MEDIUM', 'HIGH', 'ORIGINAL'] as const;
const BACKGROUNDS = ['BLACK', 'DARK', 'PAPER', 'LIGHT', 'WHITE'] as const;
const THEMES = ['DARK', 'LIGHT', 'SYSTEM'] as const;
const FONT_SIZES = ['COMPACT', 'DEFAULT', 'COMFORTABLE'] as const;
const DENSITIES = ['COMFORTABLE', 'COMPACT'] as const;

const record = (value: unknown): Record<string, unknown> => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const enumValue = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
const boundedInteger = (value: unknown, min: number, max: number, fallback: number): number =>
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
const booleanValue = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

export function normalizeUserSettings(value: unknown, defaults: UserSettings = DEFAULT_USER_SETTINGS): UserSettings {
    const root = record(value);
    const reader = record(root.reader);
    const appearance = record(root.appearance);
    const locale = record(root.locale);
    const accessibility = record(root.accessibility);

    return {
        reader: {
            direction: enumValue(reader.direction, DIRECTIONS, defaults.reader.direction),
            mode: enumValue(reader.mode, MODES, defaults.reader.mode),
            fit: enumValue(reader.fit, FITS, defaults.reader.fit),
            quality: enumValue(reader.quality, QUALITIES, defaults.reader.quality),
            saturation: boundedInteger(reader.saturation, 0, 100, defaults.reader.saturation),
            gap: boundedInteger(reader.gap, 0, 32, defaults.reader.gap),
            background: enumValue(reader.background, BACKGROUNDS, defaults.reader.background),
            autoMarkRead: booleanValue(reader.autoMarkRead, defaults.reader.autoMarkRead),
            preload: boundedInteger(reader.preload, 0, 10, defaults.reader.preload),
        },
        appearance: {
            theme: enumValue(appearance.theme, THEMES, defaults.appearance.theme),
            fontSize: enumValue(appearance.fontSize, FONT_SIZES, defaults.appearance.fontSize),
            density: enumValue(appearance.density, DENSITIES, defaults.appearance.density),
            animations: booleanValue(appearance.animations, defaults.appearance.animations),
        },
        locale: {
            dateFormat: locale.dateFormat === undefined ? defaults.locale.dateFormat : normalizeDateFormat(locale.dateFormat),
            timezone: locale.timezone === undefined ? defaults.locale.timezone : normalizeTimezone(locale.timezone),
        },
        accessibility: {
            reduceMotion: booleanValue(accessibility.reduceMotion, defaults.accessibility.reduceMotion),
            highContrast: booleanValue(accessibility.highContrast, defaults.accessibility.highContrast),
        },
    };
}

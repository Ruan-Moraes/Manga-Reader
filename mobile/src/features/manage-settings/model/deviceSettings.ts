import type { UserSettings } from '@/src/entities/user-setting';

export const USER_SETTINGS_PATHS = [
    'reader.direction',
    'reader.mode',
    'reader.fit',
    'reader.quality',
    'reader.saturation',
    'reader.gap',
    'reader.background',
    'reader.autoMarkRead',
    'reader.preload',
    'appearance.theme',
    'appearance.fontSize',
    'appearance.density',
    'appearance.animations',
    'locale.dateFormat',
    'locale.timezone',
    'accessibility.reduceMotion',
    'accessibility.highContrast',
] as const;

export type UserSettingsPath = (typeof USER_SETTINGS_PATHS)[number];

function valueAt(settings: UserSettings, path: UserSettingsPath): unknown {
    const [group, field] = path.split('.') as [keyof UserSettings, string];
    return (settings[group] as unknown as Record<string, unknown>)[field];
}

export function isUserSettingsPath(value: unknown): value is UserSettingsPath {
    return typeof value === 'string' && (USER_SETTINGS_PATHS as readonly string[]).includes(value);
}

export function diffUserSettings(previous: UserSettings, next: UserSettings): UserSettingsPath[] {
    return USER_SETTINGS_PATHS.filter(path => valueAt(previous, path) !== valueAt(next, path));
}

export function applyUserSettingsPaths(base: UserSettings, source: UserSettings, paths: readonly UserSettingsPath[]): UserSettings {
    const result: UserSettings = {
        reader: { ...base.reader },
        appearance: { ...base.appearance },
        locale: { ...base.locale },
        accessibility: { ...base.accessibility },
    };

    paths.forEach(path => {
        const [group, field] = path.split('.') as [keyof UserSettings, string];
        const target = result[group] as unknown as Record<string, unknown>;
        target[field] = valueAt(source, path);
    });

    return result;
}

export function mergeUserSettingsPaths(current: readonly UserSettingsPath[], incoming: readonly UserSettingsPath[]): UserSettingsPath[] {
    const selected = new Set([...current, ...incoming]);
    return USER_SETTINGS_PATHS.filter(path => selected.has(path));
}

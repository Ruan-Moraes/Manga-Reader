export type ThemePreference = 'SYSTEM' | 'DARK' | 'LIGHT';

export const SETTINGS_STORAGE_KEY = 'mr.settings.v1';
export const THEME_STORAGE_EVENT = 'mr.landing.theme.updated';

const DEFAULT_THEME: ThemePreference = 'SYSTEM';
const THEME_CLASSES = [
    'mr-theme-system',
    'mr-theme-dark',
    'mr-theme-light',
] as const;
const VALID_THEMES = new Set<ThemePreference>(['SYSTEM', 'DARK', 'LIGHT']);

let currentTheme: ThemePreference = DEFAULT_THEME;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isThemePreference(value: unknown): value is ThemePreference {
    return typeof value === 'string' && VALID_THEMES.has(value as ThemePreference);
}

function readStoredSettings(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return {};

        const parsed: unknown = JSON.parse(raw);
        return isRecord(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

export function readThemePreference(): ThemePreference {
    const settings = readStoredSettings();
    const appearance = settings.appearance;

    if (!isRecord(appearance) || !isThemePreference(appearance.theme)) {
        return DEFAULT_THEME;
    }

    return appearance.theme;
}

export function applyThemePreference(theme: ThemePreference): void {
    currentTheme = theme;

    if (typeof document === 'undefined') return;

    document.documentElement.classList.remove(...THEME_CLASSES);
    document.documentElement.classList.add(`mr-theme-${theme.toLowerCase()}`);
}

export function initializeThemePreference(): ThemePreference {
    const theme = readThemePreference();
    applyThemePreference(theme);
    return theme;
}

export function setThemePreference(theme: ThemePreference): void {
    applyThemePreference(theme);

    if (typeof window !== 'undefined') {
        try {
            const settings = readStoredSettings();
            const appearance = isRecord(settings.appearance)
                ? settings.appearance
                : {};

            window.localStorage.setItem(
                SETTINGS_STORAGE_KEY,
                JSON.stringify({
                    ...settings,
                    appearance: { ...appearance, theme },
                }),
            );
        } catch {
            // A preferência continua aplicada em memória durante esta sessão.
        }

        window.dispatchEvent(
            new CustomEvent<ThemePreference>(THEME_STORAGE_EVENT, {
                detail: theme,
            }),
        );
    }
}

export function getThemePreferenceSnapshot(): ThemePreference {
    return currentTheme;
}

export function subscribeThemePreference(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const onLocalUpdate = () => listener();
    const onStorage = (event: StorageEvent) => {
        if (event.key !== SETTINGS_STORAGE_KEY) return;

        applyThemePreference(readThemePreference());
        listener();
    };

    window.addEventListener(THEME_STORAGE_EVENT, onLocalUpdate);
    window.addEventListener('storage', onStorage);

    return () => {
        window.removeEventListener(THEME_STORAGE_EVENT, onLocalUpdate);
        window.removeEventListener('storage', onStorage);
    };
}

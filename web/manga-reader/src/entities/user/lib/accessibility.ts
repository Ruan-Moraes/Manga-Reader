import { DEFAULT_USER_SETTINGS, type UserSettings } from '../model/userSettings.types';

// Chave única de persistência das configurações do sistema (espelha useSettingsState).
export const SETTINGS_STORAGE_KEY = 'mr.settings.v1';
export const SETTINGS_STORAGE_EVENT = 'mr.settings.updated';

// Classe aplicada ao <html> quando "reduzir movimento" está ligado. O CSS em
// styles/index.css zera durações de animação/transição para esse seletor,
// reproduzindo o efeito do @media (prefers-reduced-motion: reduce) mesmo quando
// o SO não tem a preferência ativa.
const REDUCE_MOTION_CLASS = 'mr-reduce-motion';
const NO_ANIMATIONS_CLASS = 'mr-no-animations';
const HIGH_CONTRAST_CLASS = 'mr-high-contrast';

const FONT_CLASSES = ['mr-font-compact', 'mr-font-comfortable'] as const;
const DENSITY_CLASSES = ['mr-density-compact'] as const;
const THEME_CLASSES = ['mr-theme-dark', 'mr-theme-system'] as const;

// eslint-disable-next-line no-unused-vars
type StoredSettingsListener = (settings: UserSettings) => void;
// eslint-disable-next-line no-unused-vars
type StoredSettingsUpdater = (current: UserSettings) => UserSettings;
type PartialUserSettings = {
    [Group in keyof UserSettings]?: Partial<UserSettings[Group]>;
};

export function mergeUserSettings(settings?: PartialUserSettings | null): UserSettings {
    return {
        reader: { ...DEFAULT_USER_SETTINGS.reader, ...settings?.reader },
        appearance: { ...DEFAULT_USER_SETTINGS.appearance, ...settings?.appearance },
        locale: { ...DEFAULT_USER_SETTINGS.locale, ...settings?.locale },
        accessibility: { ...DEFAULT_USER_SETTINGS.accessibility, ...settings?.accessibility },
    };
}

export function readStoredUserSettings(): UserSettings {
    if (typeof window === 'undefined') {
        return DEFAULT_USER_SETTINGS;
    }

    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (!raw) {
            return DEFAULT_USER_SETTINGS;
        }

        return mergeUserSettings(JSON.parse(raw) as PartialUserSettings);
    } catch {
        return DEFAULT_USER_SETTINGS;
    }
}

export function writeStoredUserSettings(settings: UserSettings) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        window.queueMicrotask(() => {
            window.dispatchEvent(new CustomEvent<UserSettings>(SETTINGS_STORAGE_EVENT, { detail: settings }));
        });
    } catch {
        // localStorage indisponível (modo privado): ignora silenciosamente.
    }
}

export function updateStoredUserSettings(updater: StoredSettingsUpdater): UserSettings {
    const next = updater(readStoredUserSettings());

    writeStoredUserSettings(next);

    return next;
}

export function subscribeStoredUserSettings(listener: StoredSettingsListener) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const onLocalUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<UserSettings>;
        listener(mergeUserSettings(customEvent.detail));
    };

    const onStorage = (event: StorageEvent) => {
        if (event.key === SETTINGS_STORAGE_KEY) {
            listener(readStoredUserSettings());
        }
    };

    window.addEventListener(SETTINGS_STORAGE_EVENT, onLocalUpdate);
    window.addEventListener('storage', onStorage);

    return () => {
        window.removeEventListener(SETTINGS_STORAGE_EVENT, onLocalUpdate);
        window.removeEventListener('storage', onStorage);
    };
}

export function applyReduceMotion(enabled: boolean) {
    if (typeof document === 'undefined') return;

    document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, enabled);
}

export function applySystemPreferences(settings: UserSettings) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    root.classList.toggle(REDUCE_MOTION_CLASS, settings.accessibility.reduceMotion);
    root.classList.toggle(NO_ANIMATIONS_CLASS, !settings.appearance.animations);
    root.classList.toggle(HIGH_CONTRAST_CLASS, settings.accessibility.highContrast);

    root.classList.remove(...FONT_CLASSES);
    if (settings.appearance.fontSize === 'COMPACT') root.classList.add('mr-font-compact');
    if (settings.appearance.fontSize === 'COMFORTABLE') root.classList.add('mr-font-comfortable');

    root.classList.remove(...DENSITY_CLASSES);
    if (settings.appearance.density === 'COMPACT') root.classList.add('mr-density-compact');

    root.classList.remove(...THEME_CLASSES);
    root.classList.add(settings.appearance.theme === 'SYSTEM' ? 'mr-theme-system' : 'mr-theme-dark');
}

/** Lê a preferência persistida e aplica a classe no boot, antes de qualquer render. */
export function initAccessibilityFromStorage() {
    applySystemPreferences(readStoredUserSettings());
}

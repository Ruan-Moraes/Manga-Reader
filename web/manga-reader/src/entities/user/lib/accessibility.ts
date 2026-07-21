import { DEFAULT_USER_SETTINGS, type UserSettings } from '../model/userSettings.types';

// Chave única de persistência das configurações do sistema (espelha useSettingsState).
export const SETTINGS_STORAGE_KEY = 'mr.settings.v1';
export const SETTINGS_STORAGE_EVENT = 'mr.settings.updated';
export const LEGACY_READER_SETTINGS_KEY = 'reader:prefs';
export const SETTINGS_MIGRATION_KEY = 'mr.settings.migrations';
const READER_PREFS_MIGRATION_VERSION = 1;

// Classe aplicada ao <html> quando "reduzir movimento" está ligado. O CSS em
// styles/index.css zera durações de animação/transição para esse seletor,
// reproduzindo o efeito do @media (prefers-reduced-motion: reduce) mesmo quando
// o SO não tem a preferência ativa.
const REDUCE_MOTION_CLASS = 'mr-reduce-motion';
const NO_ANIMATIONS_CLASS = 'mr-no-animations';
const HIGH_CONTRAST_CLASS = 'mr-high-contrast';

const FONT_CLASSES = ['mr-font-compact', 'mr-font-comfortable'] as const;
const DENSITY_CLASSES = ['mr-density-compact'] as const;
const THEME_CLASSES = ['mr-theme-dark', 'mr-theme-light', 'mr-theme-system'] as const;

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

type LegacyReaderPrefs = Partial<{
    mode: 'vertical' | 'paged' | 'double';
    direction: 'ltr' | 'rtl';
    fit: 'width' | 'height' | 'original';
    gap: number;
    bg: 'black' | 'dark' | 'paper';
}>;

const legacyReaderPatch = (legacy: LegacyReaderPrefs): Partial<UserSettings['reader']> => {
    const patch: Partial<UserSettings['reader']> = {};

    if (legacy.mode && ['vertical', 'paged', 'double'].includes(legacy.mode)) patch.mode = legacy.mode.toUpperCase() as UserSettings['reader']['mode'];
    if (legacy.direction && ['ltr', 'rtl'].includes(legacy.direction)) patch.direction = legacy.direction.toUpperCase() as UserSettings['reader']['direction'];
    if (legacy.fit && ['width', 'height', 'original'].includes(legacy.fit)) patch.fit = legacy.fit.toUpperCase() as UserSettings['reader']['fit'];
    if (legacy.bg && ['black', 'dark', 'paper'].includes(legacy.bg)) patch.background = legacy.bg.toUpperCase() as UserSettings['reader']['background'];
    if (typeof legacy.gap === 'number' && Number.isFinite(legacy.gap) && legacy.gap >= 0 && legacy.gap <= 32) patch.gap = legacy.gap;

    return patch;
};

/** Migra `reader:prefs` uma única vez e só remove a origem após gravar o contrato canônico. */
export function migrateLegacyReaderSettings(): UserSettings | null {
    if (typeof window === 'undefined' || window.localStorage.getItem(SETTINGS_STORAGE_KEY)) return null;

    const raw = window.localStorage.getItem(LEGACY_READER_SETTINGS_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as LegacyReaderPrefs;
        const migrated = mergeUserSettings({ reader: legacyReaderPatch(parsed) });

        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(migrated));
        window.localStorage.setItem(SETTINGS_MIGRATION_KEY, JSON.stringify({ readerPrefs: READER_PREFS_MIGRATION_VERSION }));
        window.localStorage.removeItem(LEGACY_READER_SETTINGS_KEY);
        return migrated;
    } catch {
        // JSON inválido ou quota indisponível: preserva a chave antiga para uma nova tentativa.
        return null;
    }
}

export function readStoredUserSettings(): UserSettings {
    if (typeof window === 'undefined') {
        return DEFAULT_USER_SETTINGS;
    }

    try {
        const migrated = migrateLegacyReaderSettings();
        if (migrated) return migrated;

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
    root.classList.add(`mr-theme-${settings.appearance.theme.toLowerCase()}`);
    root.dataset.mrDateFormat = settings.locale.dateFormat;
    root.dataset.mrTimezone = settings.locale.timezone;
}

/** Lê a preferência persistida e aplica a classe no boot, antes de qualquer render. */
export function initAccessibilityFromStorage() {
    applySystemPreferences(readStoredUserSettings());
}

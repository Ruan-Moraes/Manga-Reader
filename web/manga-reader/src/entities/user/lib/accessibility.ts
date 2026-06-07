import { DEFAULT_USER_SETTINGS, type UserSettings } from '../model/userSettings.types';

// Chave única de persistência das configurações do sistema (espelha useSettingsState).
export const SETTINGS_STORAGE_KEY = 'mr.settings.v1';

// Classe aplicada ao <html> quando "reduzir movimento" está ligado. O CSS em
// styles/index.css zera durações de animação/transição para esse seletor,
// reproduzindo o efeito do @media (prefers-reduced-motion: reduce) mesmo quando
// o SO não tem a preferência ativa.
const REDUCE_MOTION_CLASS = 'mr-reduce-motion';

export function applyReduceMotion(enabled: boolean) {
    if (typeof document === 'undefined') return;

    document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, enabled);
}

/** Lê a preferência persistida e aplica a classe no boot, antes de qualquer render. */
export function initAccessibilityFromStorage() {
    if (typeof window === 'undefined') return;

    let enabled = DEFAULT_USER_SETTINGS.accessibility.reduceMotion;

    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (raw) {
            const parsed = JSON.parse(raw) as Partial<UserSettings>;
            enabled = parsed.accessibility?.reduceMotion ?? enabled;
        }
    } catch {
        // localStorage indisponível/corrompido: mantém o default.
    }

    applyReduceMotion(enabled);
}

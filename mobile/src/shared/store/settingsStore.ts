import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { DEFAULT_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from '@/src/shared/i18n';
import type { ColorScheme } from '@/src/shared/theme';

const KEYS = {
    THEME_OVERRIDE: 'mr_theme_override',
    LANGUAGE: 'mr_language',
} as const;

interface SettingsState {
    /** null = seguir o colorScheme do sistema operacional */
    themeOverride: ColorScheme | null;
    language: SupportedLanguage;
    isHydrated: boolean;
}

interface SettingsActions {
    setThemeOverride: (scheme: ColorScheme | null) => Promise<void>;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
    hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState & SettingsActions>(set => ({
    themeOverride: null,
    language: 'pt-BR',
    isHydrated: false,

    hydrate: async () => {
        const [rawTheme, rawLang] = await Promise.all([SecureStore.getItemAsync(KEYS.THEME_OVERRIDE), SecureStore.getItemAsync(KEYS.LANGUAGE)]);

        const themeOverride = rawTheme === 'dark' || rawTheme === 'light' ? (rawTheme as ColorScheme) : null;
        const language = isSupportedLanguage(rawLang) ? rawLang : DEFAULT_LANGUAGE;

        set({ themeOverride, language, isHydrated: true });
    },

    setThemeOverride: async scheme => {
        if (scheme) {
            await SecureStore.setItemAsync(KEYS.THEME_OVERRIDE, scheme);
        } else {
            await SecureStore.deleteItemAsync(KEYS.THEME_OVERRIDE);
        }
        set({ themeOverride: scheme });
    },

    setLanguage: async lang => {
        await SecureStore.setItemAsync(KEYS.LANGUAGE, lang);
        set({ language: lang });
    },
}));

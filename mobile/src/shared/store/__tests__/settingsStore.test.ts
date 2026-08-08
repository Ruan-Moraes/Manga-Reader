import * as SecureStore from 'expo-secure-store';

import { DEFAULT_LANGUAGE } from '@/src/shared/i18n';

import { useSettingsStore } from '../settingsStore';

const secureStore = jest.mocked(SecureStore);

describe('MOB-BASE-002/003 settingsStore', () => {
    beforeEach(() => {
        useSettingsStore.setState({ themeOverride: null, language: DEFAULT_LANGUAGE, isHydrated: false });
        secureStore.getItemAsync.mockResolvedValue(null);
        secureStore.setItemAsync.mockResolvedValue();
        secureStore.deleteItemAsync.mockResolvedValue();
    });

    it('hidrata preferências válidas', async () => {
        secureStore.getItemAsync.mockImplementation(async key => {
            if (key === 'mr_theme_override') return 'dark';
            if (key === 'mr_language') return 'es-ES';
            return null;
        });

        await useSettingsStore.getState().hydrate();

        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: 'dark', language: 'es-ES', isHydrated: true });
    });

    it('usa defaults quando os valores persistidos são inválidos', async () => {
        secureStore.getItemAsync.mockResolvedValue('invalid');

        await useSettingsStore.getState().hydrate();

        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: null, language: DEFAULT_LANGUAGE, isHydrated: true });
    });

    it('persiste idioma e remove override ao voltar para o sistema', async () => {
        await useSettingsStore.getState().setLanguage('en-US');
        await useSettingsStore.getState().setThemeOverride(null);

        expect(secureStore.setItemAsync).toHaveBeenCalledWith('mr_language', 'en-US');
        expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('mr_theme_override');
        expect(useSettingsStore.getState()).toMatchObject({ language: 'en-US', themeOverride: null });
    });
});

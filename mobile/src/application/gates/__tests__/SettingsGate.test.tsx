import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';

import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { resetSettingsRuntimeForTests, useSettingsStore } from '@/features/manage-settings';
import i18n, { DEFAULT_LANGUAGE } from '@/shared/i18n';

import { SettingsGate } from '../SettingsGate';

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn() }));

const secureStore = jest.mocked(SecureStore);

function TranslatedHomeLabel() {
    const { t } = useTranslation('common');
    return <Text>{t('nav.home')}</Text>;
}

describe('MOB-FEAT-001/003 SettingsGate', () => {
    beforeEach(async () => {
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
        resetSettingsRuntimeForTests();
        useSettingsStore.setState({
            settings: DEFAULT_USER_SETTINGS,
            guestSettings: DEFAULT_USER_SETTINGS,
            themeOverride: null,
            language: 'pt-BR',
            localRevision: 0,
            dirtyPaths: [],
            isHydrated: false,
            activeIdentityEpoch: null,
            syncStatus: 'local',
            pendingVersion: null,
            localError: null,
            syncError: null,
        });
        secureStore.getItemAsync.mockResolvedValue(null);
        secureStore.setItemAsync.mockResolvedValue();
        secureStore.deleteItemAsync.mockResolvedValue();
        jest.mocked(SplashScreen.hideAsync).mockResolvedValue();
    });

    it('bloqueia filhos até hidratar e então esconde o splash', async () => {
        let release!: () => void;
        secureStore.getItemAsync
            .mockImplementationOnce(async () => {
                await new Promise<void>(resolve => {
                    release = resolve;
                });
                return null;
            })
            .mockResolvedValue(null);

        render(
            <SettingsGate>
                <Text>conteúdo</Text>
            </SettingsGate>,
        );
        expect(screen.queryByText('conteúdo')).toBeNull();

        release();
        await waitFor(() => expect(screen.getByText('conteúdo')).toBeOnTheScreen());
        expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });

    it('libera a interface com defaults quando o storage rejeita', async () => {
        secureStore.getItemAsync.mockRejectedValue(new Error('unavailable'));

        render(
            <SettingsGate>
                <Text>conteúdo</Text>
            </SettingsGate>,
        );

        await waitFor(() => expect(screen.getByText('conteúdo')).toBeOnTheScreen());
        expect(useSettingsStore.getState().localError).toContain('unavailable');
    });

    it('atualiza textos montados quando o idioma muda sem remontar o gate', async () => {
        render(
            <SettingsGate>
                <TranslatedHomeLabel />
            </SettingsGate>,
        );
        await waitFor(() => expect(screen.getByText('Início')).toBeOnTheScreen());

        await act(async () => useSettingsStore.getState().setLanguage('en-US'));

        await waitFor(() => expect(screen.getByText('Home')).toBeOnTheScreen());
    });
});

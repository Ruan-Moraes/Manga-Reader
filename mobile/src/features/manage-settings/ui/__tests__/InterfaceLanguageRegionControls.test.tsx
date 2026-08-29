import * as SecureStore from 'expo-secure-store';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import i18n, { DEFAULT_LANGUAGE } from '@/src/shared/i18n';
import { ThemeProvider } from '@/src/shared/theme';

import { resetSettingsRuntimeForTests, useSettingsStore } from '../../model/settingsStore';
import { InterfaceLanguageRegionControls } from '../InterfaceLanguageRegionControls';

describe('MOB-FEAT-003 interface language controls', () => {
    beforeEach(async () => {
        resetSettingsRuntimeForTests();
        useSettingsStore.setState({
            settings: DEFAULT_USER_SETTINGS,
            guestSettings: DEFAULT_USER_SETTINGS,
            language: DEFAULT_LANGUAGE,
            isHydrated: true,
            activeIdentityEpoch: null,
            pendingVersion: null,
            syncStatus: 'local',
            localError: null,
            syncError: null,
            themeOverride: null,
        });
        jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });

    it('troca textos montados imediatamente e persiste o idioma', async () => {
        render(
            <ThemeProvider waitForPlatform={false}>
                <InterfaceLanguageRegionControls />
            </ThemeProvider>,
        );
        expect(screen.getByRole('header', { name: 'Idioma e região' })).toBeOnTheScreen();

        fireEvent.press(screen.getByText('English (US)'));
        await waitFor(() => expect(screen.getByRole('header', { name: 'Language and region' })).toBeOnTheScreen());
        expect(useSettingsStore.getState().language).toBe('en-US');
        expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('persiste formato de data e escolhe fuso em sheet sem conflitar controles', async () => {
        render(
            <ThemeProvider waitForPlatform={false}>
                <InterfaceLanguageRegionControls />
            </ThemeProvider>,
        );

        fireEvent.press(screen.getByRole('radio', { name: 'Mês, dia' }));
        fireEvent.press(screen.getByRole('button', { name: 'Fuso horário: São Paulo' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Tóquio' }));

        await waitFor(() => {
            expect(useSettingsStore.getState().settings.locale).toEqual({ dateFormat: 'MON_D', timezone: 'Asia/Tokyo' });
        });
        expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
});

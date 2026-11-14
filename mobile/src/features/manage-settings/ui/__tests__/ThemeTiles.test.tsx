import { StyleSheet, useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import i18n, { DEFAULT_LANGUAGE } from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { resetSettingsRuntimeForTests, useSettingsStore } from '../../model/settingsStore';
import { AppearanceAccessibilityControls, resolveThemeTilesStacked } from '../AppearanceAccessibilityControls';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(),
}));

const mockedDimensions = jest.mocked(useWindowDimensions);

const renderControls = () =>
    render(
        <ThemeProvider initialOverride="dark" waitForPlatform={false}>
            <AppearanceAccessibilityControls />
        </ThemeProvider>,
    );

describe('MOB-FEAT-062 tiles de tema', () => {
    beforeEach(async () => {
        mockedDimensions.mockReturnValue({ fontScale: 1, height: 844, scale: 3, width: 390 });
        resetSettingsRuntimeForTests();
        useSettingsStore.setState({ settings: DEFAULT_USER_SETTINGS, guestSettings: DEFAULT_USER_SETTINGS, isHydrated: true, syncError: null });
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });

    it('AC-003 mostra três tiles lado a lado com prévia e a descrição da opção ativa', () => {
        renderControls();

        const system = StyleSheet.flatten(screen.getByTestId('theme-tile-SYSTEM').props.style);
        const dark = StyleSheet.flatten(screen.getByTestId('theme-tile-DARK').props.style);

        expect(system.borderColor).not.toBe(dark.borderColor);
        expect(system.borderWidth).toBe(dark.borderWidth);
        expect(screen.getByTestId('theme-tiles-description').props.children).toBe(i18n.t('common:settings.appearance.theme.descriptions.SYSTEM'));

        fireEvent.press(screen.getByText('Escuro'));

        expect(useSettingsStore.getState().settings.appearance.theme).toBe('DARK');
    });

    it('AC-003 empilha em tela estreita ou fonte ampliada', () => {
        expect(resolveThemeTilesStacked('compact', 1)).toBe(true);
        expect(resolveThemeTilesStacked('regular', 1.6)).toBe(true);
        expect(resolveThemeTilesStacked('regular', 1)).toBe(false);

        mockedDimensions.mockReturnValue({ fontScale: 2, height: 568, scale: 2, width: 320 });
        renderControls();

        expect(StyleSheet.flatten(screen.getByTestId('theme-tile-SYSTEM').props.style).flex).toBeUndefined();
    });
});

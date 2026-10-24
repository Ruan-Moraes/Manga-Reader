import { StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS, themePreferenceToColorScheme } from '@/entities/user-setting';
import i18n, { DEFAULT_LANGUAGE } from '@/shared/i18n';
import { ThemeProvider, useTheme } from '@/shared/theme';

import { resetSettingsRuntimeForTests, useSettingsStore } from '../../model/settingsStore';
import { AppearanceAccessibilityControls } from '../AppearanceAccessibilityControls';
import { SettingsSyncStatus } from '../SettingsSyncStatus';

const secureStore = jest.mocked(SecureStore);

function EffectiveThemeProbe() {
    const { colorScheme, decorativeMotionEnabled, effectiveHighContrast } = useTheme();
    return <Text>{`${colorScheme}:${effectiveHighContrast}:${decorativeMotionEnabled}`}</Text>;
}

function Harness() {
    const appearance = useSettingsStore(state => state.settings.appearance);
    const accessibility = useSettingsStore(state => state.settings.accessibility);

    return (
        <ThemeProvider
            animations={appearance.animations}
            density={appearance.density}
            fontSize={appearance.fontSize}
            highContrast={accessibility.highContrast}
            initialOverride={themePreferenceToColorScheme(appearance.theme)}
            reduceMotion={accessibility.reduceMotion}
            waitForPlatform={false}
        >
            <EffectiveThemeProbe />
            <AppearanceAccessibilityControls />
        </ThemeProvider>
    );
}

const resetStore = () => {
    resetSettingsRuntimeForTests();
    useSettingsStore.setState({
        settings: DEFAULT_USER_SETTINGS,
        guestSettings: DEFAULT_USER_SETTINGS,
        themeOverride: null,
        language: DEFAULT_LANGUAGE,
        isHydrated: true,
        activeIdentityEpoch: null,
        syncStatus: 'local',
        pendingVersion: null,
        localError: null,
        syncError: null,
    });
};

describe('MOB-FEAT-002 appearance controls', () => {
    beforeEach(async () => {
        resetStore();
        secureStore.setItemAsync.mockResolvedValue();
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });

    it('anuncia seleção, aplica preview global imediato e persiste pelo settings store', async () => {
        const screen = render(<Harness />);
        const dark = screen.getByRole('radio', { name: 'Escuro' });

        expect(dark.props.accessibilityState).toEqual({ disabled: false, selected: false });
        fireEvent.press(dark);

        await waitFor(() => {
            expect(useSettingsStore.getState().settings.appearance.theme).toBe('DARK');
            expect(screen.getByText('dark:false:true')).toBeTruthy();
        });
        expect(secureStore.setItemAsync).toHaveBeenCalled();
        expect(screen.getByRole('radio', { name: 'Escuro' }).props.accessibilityState).toEqual({ disabled: false, selected: true });
    });

    it('mantém preview local, apresenta erro traduzido e oferece retry', async () => {
        const retry = jest.fn().mockResolvedValue(undefined);
        useSettingsStore.setState({ syncError: 'network', retry });
        const screen = render(<Harness />);

        expect(screen.getByText('Não foi possível sincronizar. Sua escolha continua ativa neste dispositivo.')).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: 'Escuro' }).props.accessibilityHint).toContain('Não foi possível sincronizar');
        fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('persiste tamanho, densidade e todos os booleanos no grupo de aparência', async () => {
        const screen = render(<Harness />);
        const fontGroup = screen.getByLabelText('Tamanho do texto');
        const densityGroup = screen.getByLabelText('Densidade');

        fireEvent.press(within(fontGroup).getByRole('radio', { name: 'Confortável' }));
        fireEvent.press(within(densityGroup).getByRole('radio', { name: 'Compacta' }));
        fireEvent.press(screen.getByRole('switch', { name: 'Animações decorativas' }));
        fireEvent.press(screen.getByRole('switch', { name: 'Reduzir movimento' }));
        fireEvent.press(screen.getByRole('switch', { name: 'Alto contraste' }));

        await waitFor(() => {
            expect(useSettingsStore.getState().settings.appearance).toEqual({
                animations: false,
                density: 'COMPACT',
                fontSize: 'COMFORTABLE',
                theme: 'SYSTEM',
            });
            expect(useSettingsStore.getState().settings.accessibility).toEqual({ highContrast: true, reduceMotion: true });
        });
        expect(secureStore.setItemAsync).toHaveBeenCalled();
    });

    it.each([
        ['en-US', 'Appearance', 'Follow system'],
        ['es-ES', 'Apariencia', 'Seguir el sistema'],
    ] as const)('renderiza controles no idioma %s', async (language, title, systemOption) => {
        await i18n.changeLanguage(language);
        const screen = render(<Harness />);

        expect(screen.getByRole('header', { name: title })).toBeTruthy();
        expect(screen.getByRole('radio', { name: systemOption })).toBeTruthy();
    });

    it('permite reflow com fonte confortável sem fixar largura ou altura dos controles', () => {
        useSettingsStore.setState({
            settings: {
                ...DEFAULT_USER_SETTINGS,
                appearance: { ...DEFAULT_USER_SETTINGS.appearance, fontSize: 'COMFORTABLE', density: 'COMPACT' },
            },
        });
        const view = render(<Harness />);
        const title = view.getByRole('header', { name: 'Aparência' });
        const dark = view.getByRole('radio', { name: 'Escuro' });

        expect(StyleSheet.flatten(title.props.style).fontSize).toBe(44);
        expect(dark.props.style.minHeight).toBeGreaterThanOrEqual(44);
        expect(view.UNSAFE_getAllByType(View).some(node => node.props.style?.flexWrap === 'wrap' || node.props.style?.flexDirection === 'column')).toBe(true);
        expect(dark.props.style.height).toBeUndefined();
    });

    it('oculta estados passivos e mantém sincronização operacional visível', () => {
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <SettingsSyncStatus group="appearance" />
            </ThemeProvider>,
        );

        expect(view.queryByText('Salvo neste dispositivo')).toBeNull();

        act(() => useSettingsStore.setState({ activeIdentityEpoch: 7, pendingGroup: 'appearance', syncStatus: 'syncing' }));
        view.rerender(
            <ThemeProvider waitForPlatform={false}>
                <SettingsSyncStatus group="appearance" />
            </ThemeProvider>,
        );

        expect(view.getByText('Sincronizando')).toBeOnTheScreen();
    });
});

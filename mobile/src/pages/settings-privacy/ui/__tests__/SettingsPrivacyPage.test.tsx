import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/entities/session';
import { usePrivacySettingsStore } from '@/entities/user';
import i18n from '@/shared/i18n';
import { ROUTES } from '@/shared/navigation';
import { FONTS, ThemeProvider } from '@/shared/theme';

import { SettingsPrivacyPage } from '../SettingsPrivacyPage';

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), canGoBack: () => true, push: jest.fn(), replace: jest.fn() },
}));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <SettingsPrivacyPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

describe('SettingsPrivacyPage (revisão 2026-11-13)', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
        usePrivacySettingsStore.setState({ identityEpoch: null });
    });

    it('sem conta: o aviso usa a fonte do app e o botão leva ao login com retorno', () => {
        useSessionStore.setState({ isAuthenticated: false, identityEpoch: 0 });
        renderPage();

        const hint = screen.getByText('Entre para acessar esta configuração. Depois do login, você voltará para cá.');
        expect(Object.values(FONTS)).toContain(StyleSheet.flatten(hint.props.style).fontFamily);

        fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
        expect(router.push).toHaveBeenCalledWith({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.SETTINGS.PRIVACY } });
    });

    it('com conta ainda sendo alinhada: mostra o carregamento com os pontos', () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 7 });
        renderPage();

        expect(screen.getByTestId('settings-privacy-loading')).toBeOnTheScreen();
        expect(screen.getByTestId('settings-privacy-loading-dots')).toBeOnTheScreen();
        expect(screen.getAllByText('Sincronizando').length).toBeGreaterThan(0);
    });
});

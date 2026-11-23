import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/entities/session';
import { api } from '@/shared/api';
import i18n from '@/shared/i18n';
import { FONTS, ThemeProvider } from '@/shared/theme';

import { ProfilePage } from '../ProfilePage';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), canGoBack: () => true, push: jest.fn(), replace: jest.fn() } }));

describe('Perfil (revisão 2026-11-13)', () => {
    const apiMock = new AxiosMockAdapter(api);
    const renderPage = () =>
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <ThemeProvider initialOverride="light" waitForPlatform={false}>
                    <ProfilePage />
                </ThemeProvider>
            </SafeAreaProvider>,
        );

    beforeEach(async () => {
        apiMock.reset();
        jest.mocked(router.replace).mockClear();
        await i18n.changeLanguage('pt-BR');
        useSessionStore.setState({
            isAuthenticated: true,
            user: { id: 'user-1', name: 'Ruan', email: 'ruan@example.com', role: 'MEMBER' },
        });
    });
    afterAll(() => apiMock.restore());

    it('nome e e-mail usam a fonte do app e a linha de Configurações não repete "Abrir"', () => {
        renderPage();

        for (const text of ['Ruan', 'ruan@example.com']) {
            expect(Object.values(FONTS)).toContain(StyleSheet.flatten(screen.getByText(text).props.style).fontFamily);
        }
        expect(screen.queryByText('Abrir Configurações')).toBeNull();
        expect(screen.getByLabelText('Configurações')).toHaveProp('accessibilityHint', 'Abrir Configurações');
    });

    it('sair fica ocupado, ignora o segundo toque e volta ao início uma vez', async () => {
        let release: () => void = () => undefined;
        apiMock.onPost('/auth/logout').reply(() => new Promise(resolve => (release = () => resolve([204]))));
        renderPage();

        const logout = screen.getByRole('button', { name: 'Sair' });
        fireEvent.press(logout);
        fireEvent.press(logout);
        await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
        expect(screen.getAllByRole('button').some(button => button.props.accessibilityState?.busy === true)).toBe(true);

        await act(async () => release());
        await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
        expect(apiMock.history.post).toHaveLength(1);
    });
});

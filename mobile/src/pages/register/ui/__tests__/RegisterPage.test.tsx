import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/shared/i18n';
import { darkTokens, ThemeProvider } from '@/shared/theme';

import { RegisterPage } from '../RegisterPage';

const mockSignUp = jest.fn();

jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
    useGlobalSearchParams: () => ({}),
}));

jest.mock('@/features/authenticate', () => ({
    ...jest.requireActual('@/features/authenticate'),
    signUp: (...args: unknown[]) => mockSignUp(...args),
}));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <RegisterPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

describe('MOB-FEAT-061 Criar conta', () => {
    beforeEach(async () => {
        mockSignUp.mockReset();
        await i18n.changeLanguage('pt-BR');
    });

    it('AC-001 usa o cabeçalho padrão', () => {
        renderPage();

        expect(screen.getByRole('header', { name: 'Comece a ler com a comunidade' })).toBeOnTheScreen();
        expect(screen.getByText('Crie sua conta')).toBeOnTheScreen();
    });

    it('AC-002 o erro dos termos usa o sistema tipográfico em alerta', () => {
        renderPage();

        fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

        const message = screen.getByText('É preciso aceitar os termos para continuar.');
        expect(StyleSheet.flatten(message.props.style)).toEqual(expect.objectContaining({ color: darkTokens.danger, fontSize: expect.any(Number) }));
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('AC-005 não mostra inscrição em novidades nem links de termos', () => {
        renderPage();

        expect(screen.queryByText(i18n.t('auth:signUp.newsletterOptIn'))).toBeNull();
        expect(screen.queryByRole('link')).toBeNull();
    });
});

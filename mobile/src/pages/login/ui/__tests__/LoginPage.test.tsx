import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/shared/i18n';
import { darkTokens, ThemeProvider } from '@/shared/theme';

import { LoginPage } from '../LoginPage';

const mockPush = jest.fn();
const mockSignIn = jest.fn();

jest.mock('expo-router', () => ({
    router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
    useGlobalSearchParams: () => ({}),
}));

jest.mock('@/features/authenticate', () => ({
    ...jest.requireActual('@/features/authenticate'),
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <LoginPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

describe('MOB-FEAT-061 Entrar', () => {
    beforeEach(async () => {
        mockPush.mockReset();
        mockSignIn.mockReset();
        await i18n.changeLanguage('pt-BR');
    });

    it('AC-001 mostra eyebrow, título display, apoio e imagem de 152 com raio de cartão', () => {
        renderPage();

        expect(screen.getByText('PLATAFORMA DE LEITURA')).toBeOnTheScreen();
        const title = screen.getByRole('header', { name: 'Sua biblioteca começa aqui.' });
        expect(StyleSheet.flatten(title.props.style)).toEqual(expect.objectContaining({ letterSpacing: -0.7 }));
        expect(StyleSheet.flatten(screen.getByTestId('auth-header-artwork', { includeHiddenElements: true }).props.style)).toEqual(
            expect.objectContaining({ borderColor: darkTokens.separator, borderRadius: 16, height: 152 }),
        );
    });

    it('AC-004 "Esqueci a senha" é ação do campo e o erro de credenciais fica junto do campo', async () => {
        mockSignIn.mockRejectedValueOnce(new Error('401'));
        renderPage();

        fireEvent.press(screen.getByRole('button', { name: 'Esqueci a senha' }));
        expect(mockPush).toHaveBeenCalledWith('/(auth)/forgot');

        fireEvent.changeText(screen.getByPlaceholderText(i18n.t('auth:login.emailPlaceholder')), ' leitor@toonlira.app ');
        fireEvent.changeText(screen.getByPlaceholderText(i18n.t('auth:login.passwordPlaceholder')), 'segredo123');
        fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({ email: 'leitor@toonlira.app', password: 'segredo123' }));
        expect(await screen.findByText(i18n.t('auth:login.invalidCredentials'))).toBeOnTheScreen();
    });

    it('AC-005 não mostra controles sem comportamento aprovado', () => {
        renderPage();

        expect(screen.queryByText(i18n.t('auth:login.rememberSession'))).toBeNull();
    });
});

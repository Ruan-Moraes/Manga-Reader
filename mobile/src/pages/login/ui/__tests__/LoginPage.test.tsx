import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { externalLinks } from '@/shared/config';
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
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent(i18n.t('auth:login.invalidCredentials'));
        expect(screen.getAllByRole('alert')).toEqual([alert]);
    });

    it('oferece preenchimento automático, envia pela tecla "Ir" e usa dica de texto na senha (revisão 2026-11-13)', async () => {
        mockSignIn.mockResolvedValueOnce(undefined);
        renderPage();

        const email = screen.getByPlaceholderText('voce@email.com');
        const password = screen.getByPlaceholderText('Sua senha');
        expect(screen.queryByPlaceholderText('••••••••')).toBeNull();
        expect(email.props).toEqual(expect.objectContaining({ autoComplete: 'email', textContentType: 'username' }));
        expect(password.props).toEqual(expect.objectContaining({ autoComplete: 'current-password', textContentType: 'password', returnKeyType: 'go' }));

        fireEvent(password, 'submitEditing');
        expect(mockSignIn).not.toHaveBeenCalled();

        fireEvent.changeText(email, 'leitor@toonlira.app');
        fireEvent.changeText(password, 'segredo123');
        fireEvent(password, 'submitEditing');
        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({ email: 'leitor@toonlira.app', password: 'segredo123' }));

        const artwork = screen.getByTestId('auth-header-artwork', { includeHiddenElements: true });
        expect(artwork.props).toEqual(expect.objectContaining({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }));
    });

    it('alterna a visibilidade da senha com feedback no ícone e fundo transparente', () => {
        // O estilo animado do Reanimated só avança com o relógio controlado desde a montagem.
        jest.useFakeTimers();
        renderPage();

        const showPassword = screen.getByRole('button', { name: i18n.t('auth:resetPassword.showPassword') });
        const password = screen.getByPlaceholderText(i18n.t('auth:login.passwordPlaceholder'));

        expect(password).toHaveProp('secureTextEntry', true);
        fireEvent(showPassword, 'pressIn');
        act(() => jest.advanceTimersByTime(200));
        // Ícone sem fundo: o toque responde pela opacidade e o fundo continua transparente (alfa 0).
        expect(getAnimatedStyle(showPassword)).toEqual(expect.objectContaining({ opacity: 0.6, backgroundColor: expect.stringMatching(/, 0\)$/) }));
        fireEvent(showPassword, 'pressOut');
        act(() => jest.advanceTimersByTime(200));
        jest.useRealTimers();
        fireEvent.press(showPassword);
        expect(password).toHaveProp('secureTextEntry', false);
        expect(screen.getByRole('button', { name: i18n.t('auth:resetPassword.hidePassword') })).toBeOnTheScreen();
    });

    it('AC-005 não mostra controles sem comportamento aprovado', () => {
        renderPage();

        expect(screen.queryByText(i18n.t('auth:login.rememberSession'))).toBeNull();
    });

    it('MOB-FEAT-064 AC-001 links legais abrem no navegador e o formulário continua preenchido', async () => {
        jest.spyOn(externalLinks, 'read').mockReturnValue({
            terms: 'https://toonlira-rm.web.app/legal/terms',
            privacy: 'https://toonlira-rm.web.app/legal/privacy',
        });
        const open = jest.spyOn(externalLinks, 'open').mockResolvedValue();
        mockSignIn.mockResolvedValue(undefined);
        renderPage();
        fireEvent.changeText(screen.getByPlaceholderText('voce@email.com'), 'leitor@toonlira.app');
        fireEvent.changeText(screen.getByPlaceholderText('Sua senha'), 'segredo123');

        await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Termos de uso' })));
        await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Política de privacidade' })));
        expect(open.mock.calls).toEqual([['https://toonlira-rm.web.app/legal/terms'], ['https://toonlira-rm.web.app/legal/privacy']]);

        fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({ email: 'leitor@toonlira.app', password: 'segredo123' }));
        jest.restoreAllMocks();
    });
});

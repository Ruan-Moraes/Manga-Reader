import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { ForgotPage } from '../ForgotPage';

const mockRequestReset = jest.fn();

jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
}));

jest.mock('@/features/authenticate', () => ({
    ...jest.requireActual('@/features/authenticate'),
    requestPasswordReset: (...args: unknown[]) => mockRequestReset(...args),
}));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ForgotPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

const requestReset = async () => {
    fireEvent.changeText(screen.getByPlaceholderText(i18n.t('auth:forgotPassword.emailPlaceholder')), 'leitor@toonlira.app');
    fireEvent.press(screen.getByRole('button', { name: i18n.t('auth:forgotPassword.submitAction') }));
    await screen.findByRole('header', { name: 'Verifique seu e-mail' });
};

describe('MOB-FEAT-061 Esqueci a senha', () => {
    beforeEach(async () => {
        jest.useRealTimers();
        mockRequestReset.mockReset();
        await i18n.changeLanguage('pt-BR');
    });

    it('AC-001 o formulário usa o cabeçalho padrão sem imagem', () => {
        renderPage();

        expect(screen.getByRole('header', { name: 'Esqueceu a senha?' })).toBeOnTheScreen();
        expect(screen.queryByTestId('auth-header-artwork', { includeHiddenElements: true })).toBeNull();
    });

    it('AC-003 a tela de enviado mostra pílula, título, e-mail, próximos passos e reenvio com espera', async () => {
        mockRequestReset.mockResolvedValueOnce({ expiresInSeconds: 1800 });
        renderPage();

        await requestReset();

        expect(screen.getByText('Quase lá')).toBeOnTheScreen();
        expect(screen.getByText('leitor@toonlira.app')).toBeOnTheScreen();
        expect(screen.getByText(i18n.t('auth:forgotPassword.sentExpiry', { minutes: 30 }))).toBeOnTheScreen();
        expect(screen.getByText('Próximos passos')).toBeOnTheScreen();
        expect(screen.getByText('Abra o e-mail que enviamos')).toBeOnTheScreen();
        expect(screen.getByText('Toque no link da mensagem')).toBeOnTheScreen();
        expect(screen.getByText('Defina sua nova senha')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /Não chegou\? 30s/ }).props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
        expect(screen.getAllByRole('button', { name: 'Voltar ao login' })).toHaveLength(2);
    });

    it('AC-003 falha na recuperação mostra a mesma tela neutra', async () => {
        mockRequestReset.mockRejectedValueOnce(new Error('500'));
        renderPage();

        await requestReset();

        expect(screen.getByText(i18n.t('auth:forgotPassword.sentExpiryUnknown'))).toBeOnTheScreen();
        expect(screen.getByText(/Se essa conta existir/)).toBeOnTheScreen();
    });

    it('revisão 2026-11-13: título no cabeçalho, autofill do e-mail e tecla Enviar', async () => {
        mockRequestReset.mockResolvedValue({ message: 'ok', expiresInSeconds: 900 });
        renderPage();

        expect(screen.getByRole('header', { name: 'Recuperar senha' })).toBeOnTheScreen();
        const email = screen.getByPlaceholderText(i18n.t('auth:forgotPassword.emailPlaceholder'));
        expect(email.props).toEqual(expect.objectContaining({ autoComplete: 'email', textContentType: 'username', returnKeyType: 'send' }));

        fireEvent.changeText(email, 'leitor@toonlira.app');
        fireEvent(email, 'submitEditing');

        expect(await screen.findByRole('header', { name: 'Verifique seu e-mail' })).toBeOnTheScreen();
        expect(mockRequestReset).toHaveBeenCalledWith('leitor@toonlira.app');
        expect(screen.getByRole('header', { name: 'Recuperar senha' })).toBeOnTheScreen();
    });
});

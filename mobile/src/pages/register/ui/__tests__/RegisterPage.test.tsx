import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { externalLinks } from '@/shared/config';
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

    it('AC-005 não mostra inscrição em novidades', () => {
        renderPage();

        expect(screen.queryByText(i18n.t('auth:signUp.newsletterOptIn'))).toBeNull();
    });

    it('revisão 2026-11-13: título no cabeçalho, autofill de conta nova e tecla Ir', () => {
        renderPage();

        expect(screen.getByRole('header', { name: 'Criar conta' })).toBeOnTheScreen();

        const email = screen.getByLabelText('E-mail');
        expect(email.props).toEqual(expect.objectContaining({ autoComplete: 'email', textContentType: 'username' }));
        expect(screen.getByLabelText('Nome').props).toEqual(expect.objectContaining({ autoComplete: 'name', textContentType: 'name' }));

        const password = screen.getByPlaceholderText('Crie uma senha');
        const confirm = screen.getByPlaceholderText('Repita a senha');
        for (const field of [password, confirm]) {
            expect(field.props).toEqual(expect.objectContaining({ autoComplete: 'new-password', textContentType: 'newPassword' }));
        }
        expect(confirm.props.returnKeyType).toBe('go');

        fireEvent(confirm, 'submitEditing');

        expect(screen.getByText('E-mail é obrigatório.')).toBeOnTheScreen();
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    describe('MOB-FEAT-068 validação', () => {
        const fill = (fields: { email?: string; name?: string; pw?: string; pw2?: string; terms?: boolean }) => {
            if (fields.email !== undefined) fireEvent.changeText(screen.getByLabelText('E-mail'), fields.email);
            if (fields.name !== undefined) fireEvent.changeText(screen.getByLabelText('Nome'), fields.name);
            if (fields.pw !== undefined) fireEvent.changeText(screen.getByPlaceholderText('Crie uma senha'), fields.pw);
            if (fields.pw2 !== undefined) fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), fields.pw2);
            if (fields.terms) fireEvent.press(screen.getByRole('checkbox'));
        };
        const submit = () => fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

        it.each(['ana', 'ana@', 'ana@site', 'ana @site.com'])('AC-001 recusa o e-mail "%s" sem enviar', email => {
            renderPage();
            fill({ email, name: 'Ana', pw: 'segredo123', pw2: 'segredo123', terms: true });
            submit();

            expect(screen.getByText('Formato de e-mail inválido.')).toBeOnTheScreen();
            expect(mockSignUp).not.toHaveBeenCalled();
        });

        it('AC-001 aceita e-mail com espaços nas pontas', async () => {
            mockSignUp.mockResolvedValue(undefined);
            renderPage();
            fill({ email: ' ana@site.com ', name: 'Ana', pw: 'segredo123', pw2: 'segredo123', terms: true });
            submit();

            await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith({ name: 'Ana', email: 'ana@site.com', password: 'segredo123' }));
            expect(screen.queryByText('Formato de e-mail inválido.')).toBeNull();
        });

        it('AC-002 com senha vazia, só a senha mostra erro', () => {
            renderPage();
            submit();

            expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeOnTheScreen();
            expect(screen.queryByText('As senhas não coincidem.')).toBeNull();
            expect(screen.queryByText('Confirmação de senha é obrigatória.')).toBeNull();
        });

        it('AC-002 com senha curta, a confirmação não mostra erro', () => {
            renderPage();
            fill({ pw: '123', pw2: '999' });
            submit();

            expect(screen.queryByText('As senhas não coincidem.')).toBeNull();
        });

        it('AC-003 confirmação vazia, diferente e igual', async () => {
            mockSignUp.mockResolvedValue(undefined);
            renderPage();
            fill({ email: 'ana@site.com', name: 'Ana', pw: 'segredo123', terms: true });
            submit();
            expect(screen.getByText('Confirmação de senha é obrigatória.')).toBeOnTheScreen();

            fill({ pw2: 'segredo124' });
            submit();
            expect(screen.getByText('As senhas não coincidem.')).toBeOnTheScreen();
            expect(mockSignUp).not.toHaveBeenCalled();

            fill({ pw2: 'segredo123' });
            submit();
            await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
        });
    });

    describe('MOB-FEAT-064 links legais', () => {
        afterEach(() => jest.restoreAllMocks());

        it('AC-002 os links abrem os documentos sem mudar o aceite, e o envio exige a caixa', async () => {
            jest.spyOn(externalLinks, 'read').mockReturnValue({
                terms: 'https://toonlira-rm.web.app/legal/terms',
                privacy: 'https://toonlira-rm.web.app/legal/privacy',
            });
            const open = jest.spyOn(externalLinks, 'open').mockResolvedValue();
            renderPage();
            fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@site.com');

            await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Termos de uso' })));
            await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Política de privacidade' })));

            expect(open.mock.calls).toEqual([['https://toonlira-rm.web.app/legal/terms'], ['https://toonlira-rm.web.app/legal/privacy']]);
            expect(screen.getByRole('checkbox', { checked: false })).toBeOnTheScreen();
            expect(screen.getByLabelText('E-mail')).toHaveDisplayValue('ana@site.com');

            fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
            expect(screen.getByText('É preciso aceitar os termos para continuar.')).toBeOnTheScreen();
            expect(mockSignUp).not.toHaveBeenCalled();
        });
    });
});

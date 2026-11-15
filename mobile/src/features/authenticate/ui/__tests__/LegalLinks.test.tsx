import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { externalLinks } from '@/shared/config';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { SignInLegalNotice } from '../LegalLinks';

const TERMS = 'https://toonlira-rm.web.app/legal/terms';
const PRIVACY = 'https://toonlira-rm.web.app/legal/privacy';

const renderNotice = () =>
    render(
        <ThemeProvider initialOverride="dark" waitForPlatform={false}>
            <SignInLegalNotice />
        </ThemeProvider>,
    );

describe('MOB-FEAT-064 links legais da conta', () => {
    beforeEach(async () => {
        jest.restoreAllMocks();
        await i18n.changeLanguage('pt-BR');
    });

    it('não mostra nada sem destino configurado', () => {
        jest.spyOn(externalLinks, 'read').mockReturnValue({});
        renderNotice();

        expect(screen.queryByTestId('sign-in-legal-notice')).toBeNull();
    });

    it('revisão 2026-11-13: frase de aceite com os nomes das políticas como links', async () => {
        jest.spyOn(externalLinks, 'read').mockReturnValue({ terms: TERMS, privacy: PRIVACY, support: 'https://example.com' });
        const open = jest.spyOn(externalLinks, 'open').mockResolvedValue();
        renderNotice();

        expect(screen.getByText(/Ao entrar, você concorda com os/)).toBeOnTheScreen();
        expect(screen.getAllByRole('link')).toHaveLength(2);
        await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Termos de uso' })));
        await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Política de privacidade' })));

        expect(open.mock.calls).toEqual([[TERMS], [PRIVACY]]);
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('mostra erro localizado e tenta de novo o mesmo link quando o navegador falha', async () => {
        jest.spyOn(externalLinks, 'read').mockReturnValue({ terms: TERMS, privacy: PRIVACY });
        const open = jest.spyOn(externalLinks, 'open').mockRejectedValueOnce(new Error('open-failed')).mockResolvedValue();
        renderNotice();

        await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Política de privacidade' })));
        expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível abrir o link.');

        await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Tentar abrir de novo' })));

        expect(open.mock.calls).toEqual([[PRIVACY], [PRIVACY]]);
        expect(screen.queryByRole('alert')).toBeNull();
    });
});

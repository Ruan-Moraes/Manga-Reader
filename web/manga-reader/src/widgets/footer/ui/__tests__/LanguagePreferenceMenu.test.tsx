import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import i18n from '@/i18n/config';

import LanguagePreferenceMenu from '../LanguagePreferenceMenu';

describe('LanguagePreferenceMenu', () => {
    afterEach(() => {
        void i18n.changeLanguage('pt-BR');
    });

    it('abre dropdown com os dois eixos (Interface + Conteúdo)', async () => {
        const user = userEvent.setup();

        renderWithProviders(<LanguagePreferenceMenu />);

        await user.click(screen.getByRole('button', { name: /idioma/i }));

        await waitFor(() => {
            expect(screen.getByText('Interface')).toBeInTheDocument();
        });
        expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    });

    it('mostra dica de login no grupo Conteúdo quando deslogado', async () => {
        const user = userEvent.setup();

        renderWithProviders(<LanguagePreferenceMenu />);

        await user.click(screen.getByRole('button', { name: /idioma/i }));

        await waitFor(() => {
            expect(screen.getByText(/faça login para escolher/i)).toBeInTheDocument();
        });
    });

    it('troca o idioma da interface ao selecionar uma opção', async () => {
        const user = userEvent.setup();

        renderWithProviders(<LanguagePreferenceMenu />);

        await user.click(screen.getByRole('button', { name: /idioma/i }));

        const englishItem = await screen.findByRole('menuitem', { name: /inglês/i });

        await user.click(englishItem);

        await waitFor(() => {
            expect(i18n.language).toBe('en-US');
        });
    });
});

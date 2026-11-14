import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';

import NewReleases from '../NewReleases';

describe('NewReleases', () => {
    beforeEach(() => {
        window.history.replaceState({}, '', '/releases');
    });

    it('renders the integrated release feed without raw translation keys', async () => {
        const { container } = renderWithProviders(<NewReleases />);
        expect(await screen.findByRole('heading', { name: /lançamentos recentes/i })).toBeInTheDocument();
        expect(await screen.findByText('Berserk')).toBeInTheDocument();
        expect(screen.getByText(/2 capítulos encontrados/i)).toBeInTheDocument();
        expect(container.textContent).not.toMatch(/releases\.(todayMeta|chaptersCount)/i);
    });

    it('combines title and language filters through the URL-backed query', async () => {
        const user = userEvent.setup();
        renderWithProviders(<NewReleases />);
        await screen.findByText('Berserk');
        await user.type(screen.getByRole('searchbox'), 'Berserk');
        await user.click(screen.getByRole('combobox', { name: /idioma do capítulo/i }));
        await user.click(await screen.findByRole('menuitem', { name: 'pt-BR' }));
        await waitFor(() => expect(window.location.search).toContain('q=Berserk'));
        expect(window.location.search).toContain('language=pt-BR');
        expect(screen.getByText('1 capítulo encontrado')).toBeInTheDocument();
        expect(screen.getByText('Berserk')).toBeInTheDocument();
    });

    it('keeps title and chapter navigation as separate actions', async () => {
        renderWithProviders(<NewReleases />);
        const titleLink = await screen.findByRole('link', { name: 'Berserk' });
        const chapterButton = screen.getAllByRole('button', { name: /abrir capítulo/i })[0];
        expect(titleLink).toHaveAttribute('href', expect.stringContaining('/titles/title-berserk'));
        expect(chapterButton).toBeInTheDocument();
    });

    it('shows a contextual empty state and clears filters', async () => {
        const user = userEvent.setup();
        renderWithProviders(<NewReleases />);
        await user.type(screen.getByRole('searchbox'), 'inexistente');
        expect(await screen.findByText(/tudo em dia/i)).toBeInTheDocument();
        await user.click(screen.getAllByRole('button', { name: /limpar filtros/i })[0]);
        expect(await screen.findByText('Berserk')).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<NewReleases />);
        await screen.findByText('Berserk');
        expect(await axeComponent(container)).toHaveNoViolations();
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { CHAPTER_STORE_KEY, chapterAdminGateway } from '@entities/chapter';

import DashboardChapters from '../DashboardChapters';

const renderPage = (query = '') =>
    render(
        <TestProviders client={createTestQueryClient()}>
            <MemoryRouter initialEntries={[`/dashboard/chapters${query}`]}>
                <Routes>
                    <Route path="/dashboard/chapters" element={<DashboardChapters />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );

describe('DashboardChapters', () => {
    beforeEach(() => {
        localStorage.removeItem(CHAPTER_STORE_KEY);
    });

    it('lista capítulos semeados com contagem e status', async () => {
        renderPage();

        expect(await screen.findByRole('heading', { name: 'Capítulos' })).toBeInTheDocument();
        await waitFor(() => expect(screen.getAllByText(/Capítulo \d+/).length).toBeGreaterThan(0), { timeout: 5000 });
        expect(screen.getByText(/^\d+ capítulos$/)).toBeInTheDocument();
    });

    it('busca por número filtra no "servidor"', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findAllByText(/Capítulo \d+/, {}, { timeout: 5000 });

        await user.type(screen.getByPlaceholderText('Buscar por título ou número...'), 'Capítulo 3');
        await user.click(screen.getByRole('button', { name: 'Buscar' }));

        await waitFor(() => {
            const rows = screen.getAllByText(/Capítulo \d+/);
            expect(rows.every(el => el.textContent?.includes('Capítulo 3'))).toBe(true);
        });
    });

    it('?titleId= filtra por obra e mostra ações da obra (reordenar)', async () => {
        renderPage('?titleId=2');

        await screen.findAllByText('Lâmina do Amanhã', {}, { timeout: 5000 });
        expect(screen.getByText('Exibindo capítulos de uma obra específica')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reordenar/ })).toBeInTheDocument();
        // Nenhum capítulo de outra obra na lista filtrada.
        expect(screen.queryByText('Reino de Aço')).not.toBeInTheDocument();
    });

    it('exclusão exige confirmação digitando o ID e remove o capítulo da lista', async () => {
        const user = userEvent.setup();
        renderPage('?titleId=1');
        await screen.findAllByText(/Capítulo \d+/, {}, { timeout: 5000 });

        const firstDelete = screen.getAllByRole('button', { name: 'Excluir capítulo' })[0];
        await user.click(firstDelete);

        const dialog = await screen.findByRole('dialog');
        const idCode = within(dialog).getByText(/seed_1_/).textContent!;
        await user.type(within(dialog).getByRole('textbox'), idCode);
        await user.click(within(dialog).getByRole('button', { name: /excluir/i }));

        await waitFor(() => expect(screen.queryByText(idCode)).not.toBeInTheDocument(), { timeout: 5000 });
    });

    it('seleção múltipla + exclusão em lote com confirmação', async () => {
        const user = userEvent.setup();
        renderPage('?titleId=3');
        await screen.findAllByText(/Capítulo \d+/, {}, { timeout: 5000 });

        const before = (await chapterAdminGateway.list({ page: 0, size: 100, titleId: '3' })).totalElements;

        await user.click(screen.getByLabelText('Selecionar todos os capítulos da página'));
        expect(screen.getByText(/\d+ selecionados/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Excluir selecionados' }));
        const dialog = await screen.findByRole('dialog');
        await user.click(within(dialog).getByRole('button', { name: 'Excluir selecionados' }));

        await waitFor(async () => {
            const after = (await chapterAdminGateway.list({ page: 0, size: 100, titleId: '3' })).totalElements;
            expect(after).toBeLessThan(before);
        }, { timeout: 5000 });
    });

    it('duplicar cria rascunho com próximo número livre', async () => {
        const user = userEvent.setup();
        renderPage('?titleId=4');
        await screen.findAllByText(/Capítulo \d+/, {}, { timeout: 5000 });

        const before = (await chapterAdminGateway.list({ page: 0, size: 100, titleId: '4' })).totalElements;
        await user.click(screen.getAllByLabelText('Duplicar capítulo como rascunho')[0]);

        await waitFor(async () => {
            const after = await chapterAdminGateway.list({ page: 0, size: 100, titleId: '4' });
            expect(after.totalElements).toBe(before + 1);
            expect(after.content.some(c => c.status === 'draft' && c.createdBy === 'admin')).toBe(true);
        }, { timeout: 5000 });
    });
});

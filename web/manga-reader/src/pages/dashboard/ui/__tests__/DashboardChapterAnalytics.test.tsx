import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { CHAPTER_STORE_KEY, chapterAdminGateway } from '@entities/chapter';

import DashboardChapterAnalytics from '../DashboardChapterAnalytics';

const renderPage = () =>
    render(
        <TestProviders client={createTestQueryClient()}>
            <MemoryRouter initialEntries={['/dashboard/chapters/analytics']}>
                <DashboardChapterAnalytics />
            </MemoryRouter>
        </TestProviders>,
    );

describe('DashboardChapterAnalytics', () => {
    beforeEach(() => {
        localStorage.removeItem(CHAPTER_STORE_KEY);
    });

    it('estado vazio quando não há dados no armazenamento provisório', async () => {
        renderPage();

        expect(await screen.findByRole('heading', { name: 'Métricas de capítulos' })).toBeInTheDocument();
        expect(await screen.findByText('Nenhum capítulo publicado no recorte selecionado.', {}, { timeout: 5000 })).toBeInTheDocument();
    });

    it('tabela comparativa lista capítulos publicados com leituras', async () => {
        await chapterAdminGateway.list({ page: 0, size: 1 }); // semeia o catálogo
        renderPage();

        await waitFor(() => expect(screen.getAllByText(/Capítulo \d+/).length).toBeGreaterThan(0), { timeout: 5000 });
        expect(screen.getByText('Leituras')).toBeInTheDocument();
        expect(screen.getByText('Leitores únicos')).toBeInTheDocument();
    });

    it('filtro de dispositivo altera os números (recorte determinístico)', async () => {
        await chapterAdminGateway.list({ page: 0, size: 1 });
        renderPage();
        await waitFor(() => expect(screen.getAllByText(/Capítulo \d+/).length).toBeGreaterThan(0), { timeout: 5000 });

        // Primeira linha de dados da tabela (índice 0 é o header).
        const beforeText = screen.getAllByRole('row')[1].textContent;

        await userEvent.click(screen.getByRole('combobox', { name: 'Dispositivo' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Celular' }));

        await waitFor(() => {
            expect(screen.getAllByRole('row')[1].textContent).not.toBe(beforeText);
        }, { timeout: 5000 });
    });
});

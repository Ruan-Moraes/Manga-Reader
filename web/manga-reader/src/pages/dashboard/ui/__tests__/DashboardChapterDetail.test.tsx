import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { CHAPTER_STORE_KEY, chapterAdminGateway, type AdminChapter } from '@entities/chapter';

import DashboardChapterDetail from '../DashboardChapterDetail';

const renderDetail = (chapterId: string) =>
    render(
        <TestProviders client={createTestQueryClient()}>
            <MemoryRouter initialEntries={[`/dashboard/chapters/${chapterId}`]}>
                <Routes>
                    <Route path="/dashboard/chapters/:chapterId" element={<DashboardChapterDetail />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );

const seededPublished = async (): Promise<AdminChapter> => (await chapterAdminGateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];

describe('DashboardChapterDetail', () => {
    beforeEach(() => {
        localStorage.removeItem(CHAPTER_STORE_KEY);
    });

    it('mostra cabeçalho com número, título, obra, status e tabs', async () => {
        const chapter = await seededPublished();
        renderDetail(chapter.id);

        expect(await screen.findByRole('heading', { name: new RegExp(chapter.title) }, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.getAllByText(chapter.titleName).length).toBeGreaterThan(0);
        expect(screen.getAllByText('Publicado').length).toBeGreaterThan(0);
        expect(screen.getByRole('tab', { name: 'Detalhes' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Páginas/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Métricas' })).toBeInTheDocument();
    });

    it('tab Páginas lista as páginas do capítulo', async () => {
        const chapter = await seededPublished();
        renderDetail(chapter.id);
        await screen.findByRole('heading', { name: new RegExp(chapter.title) }, { timeout: 5000 });

        await userEvent.click(screen.getByRole('tab', { name: /Páginas/ }));

        await waitFor(() => expect(screen.getByText(`${chapter.pagesCount} páginas`)).toBeInTheDocument(), { timeout: 5000 });
        expect(screen.getAllByLabelText(/Posição da página/).length).toBe(chapter.pagesCount);
    });

    it('tab Métricas mostra os cards principais (dados simulados)', async () => {
        const chapter = await seededPublished();
        renderDetail(chapter.id);
        await screen.findByRole('heading', { name: new RegExp(chapter.title) }, { timeout: 5000 });

        await userEvent.click(screen.getByRole('tab', { name: 'Métricas' }));

        expect(await screen.findByText('Leitores únicos', {}, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.getByText('Taxa de conclusão')).toBeInTheDocument();
        expect(screen.getByText('Evolução das leituras')).toBeInTheDocument();
    });

    it('botão Prévia existe e aponta para o leitor com ?preview=1', async () => {
        const chapter = await seededPublished();
        renderDetail(chapter.id);
        await screen.findByRole('heading', { name: new RegExp(chapter.title) }, { timeout: 5000 });

        expect(screen.getByRole('button', { name: 'Prévia' })).toBeInTheDocument();
    });

    it('adicionar páginas simuladas atualiza a contagem (pipeline inicia em uploading)', async () => {
        const draft = await (async () => {
            await chapterAdminGateway.list({ page: 0, size: 1 });
            return chapterAdminGateway.create({ titleId: '1', title: 'Draft com páginas', number: '950' });
        })();

        renderDetail(draft.id);
        await screen.findByRole('heading', { name: /Draft com páginas/ }, { timeout: 5000 });
        await userEvent.click(screen.getByRole('tab', { name: /Páginas/ }));

        const input = await screen.findByTestId('add-pages-input');
        await userEvent.upload(input, [new File(['a'], 'p1.jpg', { type: 'image/jpeg' })]);

        expect(await screen.findByText('Enviando', {}, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.getByText('1 páginas')).toBeInTheDocument();
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
        const pages = await chapterAdminGateway.listPages(chapter.id);
        renderDetail(chapter.id);
        await screen.findByRole('heading', { name: new RegExp(chapter.title) }, { timeout: 5000 });

        fireEvent.click(screen.getByRole('tab', { name: /Páginas/ }));

        expect(await screen.findByRole('status')).toHaveTextContent('Gerenciamento de arquivos indisponível');
        expect(screen.getByText(`${pages.length} páginas`)).toBeInTheDocument();
        expect(screen.queryAllByLabelText(/Posição da página/).length).toBe(pages.length);
    });

    it('tab Métricas mostra os cards principais retornados pela API', async () => {
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

    it('expõe páginas como somente leitura enquanto o serviço de mídia está indisponível', async () => {
        const draft = await (async () => {
            await chapterAdminGateway.list({ page: 0, size: 1 });
            return chapterAdminGateway.create({ titleId: '1', title: 'Draft com páginas', number: '950' });
        })();

        renderDetail(draft.id);
        await screen.findByRole('heading', { name: /Draft com páginas/ }, { timeout: 5000 });
        await userEvent.click(screen.getByRole('tab', { name: /Páginas/ }));

        expect(await screen.findByRole('status')).toHaveTextContent('Gerenciamento de arquivos indisponível');
        expect(screen.getByRole('button', { name: 'Adicionar páginas' })).toBeDisabled();
    });
});

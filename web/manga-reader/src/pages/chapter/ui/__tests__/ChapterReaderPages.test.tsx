import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { buildAuthResponse } from '@/test/factories';
import { persistSession, clearSession } from '@shared/service/session';
import { CHAPTER_STORE_KEY, chapterAdminGateway } from '@entities/chapter';

import Chapter from '../Chapter';

const renderReader = (titleId: string, chapter: string, query = '') =>
    render(
        <TestProviders client={createTestQueryClient()}>
            <MemoryRouter initialEntries={[`/titles/${titleId}/chapters/${chapter}${query}`]}>
                <Routes>
                    <Route path="/titles/:titleId/chapters/:chapter" element={<Chapter />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );

/** Sessão + /auth/me com role ADMIN (o AuthProvider revalida via API). */
const adminSession = () => {
    persistSession({
        userId: 'u1',
        name: 'Admin',
        email: 'admin@test.dev',
        role: 'ADMIN',
    });
    server.use(http.get('*/api/auth/me', () => HttpResponse.json({ data: buildAuthResponse({ role: 'ADMIN' }), success: true })));
};

describe('Chapter (Reader) — páginas reais do armazenamento provisório', () => {
    beforeEach(() => {
        localStorage.removeItem(CHAPTER_STORE_KEY);
        clearSession();
    });

    it('sem dados no armazenamento provisório mantém o fallback de placeholders (sem <img>)', async () => {
        renderReader('1', '1');

        expect(await screen.findByRole('main', { name: /leitor de mangá/i })).toBeInTheDocument();
        await waitFor(() => expect(document.querySelectorAll('img.reader-page-img')).toHaveLength(0));
    });

    it('capítulo published renderiza as imagens reais ordenadas', async () => {
        const published = (await chapterAdminGateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];
        renderReader('1', published.number);

        await waitFor(() => expect(document.querySelectorAll('img.reader-page-img').length).toBe(published.readyPagesCount), { timeout: 5000 });
        const first = document.querySelector('img.reader-page-img') as HTMLImageElement;
        expect(first.src).toContain('picsum.photos');
    });

    it('capítulo oculto mostra "capítulo indisponível" para o público', async () => {
        const published = (await chapterAdminGateway.list({ page: 0, size: 1, titleId: '2', status: ['published'] })).content[0];
        await chapterAdminGateway.changeStatus(published.id, 'hidden');

        renderReader('2', published.number);

        expect(await screen.findByText('Capítulo indisponível', {}, { timeout: 5000 })).toBeInTheDocument();
        expect(document.querySelectorAll('img.reader-page-img')).toHaveLength(0);
    });

    it('capítulo oculto continua acessível ao admin via ?preview=1 (com badge)', async () => {
        const published = (await chapterAdminGateway.list({ page: 0, size: 1, titleId: '2', status: ['published'] })).content[0];
        await chapterAdminGateway.changeStatus(published.id, 'hidden');
        adminSession();

        renderReader('2', published.number, '?preview=1');

        await waitFor(() => expect(document.querySelectorAll('img.reader-page-img').length).toBeGreaterThan(0), { timeout: 5000 });
        expect(screen.getByText('Prévia administrativa')).toBeInTheDocument();
        expect(screen.queryByText('Capítulo indisponível')).not.toBeInTheDocument();
    });

    it('?preview=1 sem role admin NÃO libera capítulo não-publicado', async () => {
        const published = (await chapterAdminGateway.list({ page: 0, size: 1, titleId: '2', status: ['published'] })).content[0];
        await chapterAdminGateway.changeStatus(published.id, 'hidden');

        renderReader('2', published.number, '?preview=1');

        expect(await screen.findByText('Capítulo indisponível', {}, { timeout: 5000 })).toBeInTheDocument();
    });

    it('erro de carregamento de imagem mostra retry por página e recarrega com cache-buster', async () => {
        const published = (await chapterAdminGateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];
        renderReader('1', published.number);

        await waitFor(() => expect(document.querySelectorAll('img.reader-page-img').length).toBeGreaterThan(0), { timeout: 5000 });

        const first = document.querySelector('img.reader-page-img') as HTMLImageElement;
        const originalSrc = first.src;
        fireEvent.error(first);

        const retry = await screen.findByRole('button', { name: /Recarregar página/ });
        fireEvent.click(retry);

        await waitFor(() => {
            const reloaded = document.querySelector('img.reader-page-img') as HTMLImageElement;
            expect(reloaded.src).toContain('retry=1');
            expect(reloaded.src).not.toBe(originalSrc);
        });
    });
});

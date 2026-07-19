import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { buildAuthResponse } from '@/test/factories';
import { persistSession, clearSession } from '@shared/service/session';

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

const readerChapter = {
    id: 'chapter-1',
    titleId: '1',
    number: '1',
    title: 'Capítulo 1',
    status: 'PUBLISHED',
    pages: [
        { id: 'page-1', order: 1, imageUrl: 'https://picsum.photos/seed/page-1/800/1200', thumbnailUrl: 'https://picsum.photos/seed/page-1/200/300', width: 800, height: 1200 },
        { id: 'page-2', order: 2, imageUrl: 'https://picsum.photos/seed/page-2/800/1200', thumbnailUrl: 'https://picsum.photos/seed/page-2/200/300', width: 800, height: 1200 },
    ],
};

const serveReaderChapter = () =>
    server.use(http.get('*/api/titles/:titleId/chapters/:number/reader', () => HttpResponse.json({ data: readerChapter, success: true })));

const serveUnavailableChapter = () =>
    server.use(http.get('*/api/titles/:titleId/chapters/:number/reader', () => HttpResponse.json({ success: false }, { status: 404 })));

describe('Chapter (Reader) — páginas reais entregues pela API', () => {
    beforeEach(() => {
        clearSession();
    });

    it('resposta 404 não inventa placeholders e mostra capítulo indisponível', async () => {
        serveUnavailableChapter();
        renderReader('1', '1');

        expect(await screen.findByText('Capítulo indisponível')).toBeInTheDocument();
        expect(document.querySelectorAll('img.reader-page-img')).toHaveLength(0);
    });

    it('capítulo published renderiza as imagens reais ordenadas', async () => {
        serveReaderChapter();
        renderReader('1', '1');

        await waitFor(() => expect(document.querySelectorAll('img.reader-page-img').length).toBe(readerChapter.pages.length), { timeout: 5000 });
        const first = document.querySelector('img.reader-page-img') as HTMLImageElement;
        expect(first.src).toContain('picsum.photos');
    });

    it('capítulo oculto mostra "capítulo indisponível" para o público', async () => {
        serveUnavailableChapter();
        renderReader('2', '1');

        expect(await screen.findByText('Capítulo indisponível', {}, { timeout: 5000 })).toBeInTheDocument();
        expect(document.querySelectorAll('img.reader-page-img')).toHaveLength(0);
    });

    it('capítulo oculto continua acessível ao admin via ?preview=1 (com badge)', async () => {
        server.use(http.get('*/api/titles/:titleId/chapters/:number/reader', ({ request }) => {
            const preview = new URL(request.url).searchParams.get('preview') === 'true';
            return preview
                ? HttpResponse.json({ data: { ...readerChapter, status: 'HIDDEN' }, success: true })
                : HttpResponse.json({ success: false }, { status: 404 });
        }));
        adminSession();

        renderReader('2', '1', '?preview=1');

        await waitFor(() => expect(document.querySelectorAll('img.reader-page-img').length).toBeGreaterThan(0), { timeout: 5000 });
        expect(screen.getByText('Prévia administrativa')).toBeInTheDocument();
        expect(screen.queryByText('Capítulo indisponível')).not.toBeInTheDocument();
    });

    it('?preview=1 sem role admin NÃO libera capítulo não-publicado', async () => {
        serveUnavailableChapter();
        renderReader('2', '1', '?preview=1');

        expect(await screen.findByText('Capítulo indisponível', {}, { timeout: 5000 })).toBeInTheDocument();
    });

    it('erro de carregamento de imagem mostra retry por página e recarrega com cache-buster', async () => {
        serveReaderChapter();
        renderReader('1', '1');

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

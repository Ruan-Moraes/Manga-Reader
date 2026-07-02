import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { DEFAULT_USER_SETTINGS, SETTINGS_STORAGE_KEY } from '@entities/user';

import Chapter from '../Chapter';

const renderChapter = (titleId = '1', chapter = '1') => {
    const client = createTestQueryClient();

    return render(
        <TestProviders client={client}>
            <MemoryRouter initialEntries={[`/titles/${titleId}/chapters/${chapter}`]}>
                <Routes>
                    <Route path="/titles/:titleId/chapters/:chapter" element={<Chapter />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );
};

describe('Chapter (Reader)', () => {
    it('renders main landmark', () => {
        renderChapter();
        expect(screen.getByRole('main', { name: /leitor de mangá/i })).toBeInTheDocument();
    });

    it('renders reader toolbar', () => {
        renderChapter();
        expect(screen.getByRole('toolbar', { name: /controles do leitor/i })).toBeInTheDocument();
    });

    it('renders back button', () => {
        renderChapter();
        expect(screen.getAllByRole('button', { name: /voltar/i }).length).toBeGreaterThan(0);
    });

    it('renders save bookmark button', () => {
        renderChapter();
        expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    });

    it('renders settings button', () => {
        renderChapter();
        expect(screen.getByRole('button', { name: /configurações/i })).toBeInTheDocument();
    });

    it('renders title name when titleId=1', async () => {
        server.use(
            http.get('*/api/titles/:id', ({ params }) =>
                HttpResponse.json({
                    data: { id: params.id as string, name: 'Berserk' },
                    success: true,
                }),
            ),
        );
        renderChapter('1', '1');
        expect(await screen.findByText('Berserk')).toBeInTheDocument();
    });

    it('renders chapter and page info', () => {
        renderChapter('1', '5');
        // "cap. 5" aparece no topbar e no painel de comentários do leitor
        expect(screen.getAllByText(/cap\. 5/i).length).toBeGreaterThan(0);
    });

    it('renders page slider', () => {
        renderChapter();
        expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders page images in vertical mode (default)', () => {
        renderChapter();
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
    });

    it('opens settings drawer on settings button click', async () => {
        const user = userEvent.setup();

        renderChapter();

        await user.click(screen.getByRole('button', { name: /configurações/i }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('starts reader controls from global system settings', async () => {
        const user = userEvent.setup();

        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({
                ...DEFAULT_USER_SETTINGS,
                reader: { ...DEFAULT_USER_SETTINGS.reader, mode: 'PAGED', direction: 'LTR', fit: 'ORIGINAL', gap: 16, background: 'PAPER' },
            }),
        );

        renderChapter();

        await user.click(screen.getByRole('button', { name: /configurações/i }));

        expect(screen.getByRole('button', { name: /paginado/i }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: /^ltr$/i }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: /original/i }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: /papel/i }).getAttribute('aria-pressed')).toBe('true');
    });

    it('writes reader drawer changes back to global system settings', async () => {
        const user = userEvent.setup();

        renderChapter();

        await user.click(screen.getByRole('button', { name: /configurações/i }));
        await user.click(screen.getByRole('button', { name: /dupla/i }));

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
            expect(stored.reader.mode).toBe('DOUBLE');
        });
    });
});

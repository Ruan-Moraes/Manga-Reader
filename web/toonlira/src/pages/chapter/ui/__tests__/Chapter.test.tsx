import { beforeEach, describe, it, expect } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { DEFAULT_USER_SETTINGS, SETTINGS_STORAGE_KEY } from '@entities/user';

import Chapter from '../Chapter';

const renderChapter = (titleId = '1', chapter = '1') => {
    const client = createTestQueryClient();

    return render(
        <TestProviders client={client}>
            <MemoryRouter initialEntries={[`/titles/${titleId}/chapters/${chapter}`]}>
                <Routes>
                    <Route path="/titles/:titleId/chapters/:chapter" element={<Chapter />} />
                    {/* useAppNavigate prefixa WEB_BASE_URL — rota extra para navegações internas */}
                    <Route path={`${WEB_BASE_URL}/titles/:titleId/chapters/:chapter`} element={<Chapter />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );
};

describe('Chapter (Reader)', () => {
    beforeEach(() => {
        server.use(
            http.get('*/api/titles/:titleId/chapters/:number/reader', ({ params }) =>
                HttpResponse.json({
                    data: {
                        id: `chapter-${String(params.number)}`,
                        titleId: String(params.titleId),
                        number: String(params.number),
                        title: `Capítulo ${String(params.number)}`,
                        status: 'PUBLISHED',
                        pages: [
                            {
                                id: 'page-1',
                                order: 1,
                                imageUrl: 'https://example.com/page-1.jpg',
                                thumbnailUrl: 'https://example.com/page-1-thumb.jpg',
                                width: 800,
                                height: 1200,
                            },
                        ],
                    },
                    success: true,
                }),
            ),
        );
    });

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
        expect(screen.getByRole('button', { name: /sépia/i }).getAttribute('aria-pressed')).toBe('true');
    });

    it('persists the light reader background options', async () => {
        const user = userEvent.setup();

        renderChapter();

        await user.click(screen.getByRole('button', { name: /configurações/i }));
        await user.click(screen.getByRole('button', { name: /^claro$/i }));

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
            expect(stored.reader.background).toBe('LIGHT');
        });

        await user.click(screen.getByRole('button', { name: /^branco$/i }));

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
            expect(stored.reader.background).toBe('WHITE');
        });
    });

    it('persists saturation changes and applies them to chapter images', async () => {
        const user = userEvent.setup();
        renderChapter();

        await user.click(screen.getByRole('button', { name: /configurações/i }));
        const saturation = screen.getByRole('slider', { name: /saturação/i });
        fireEvent.change(saturation, { target: { value: '0' } });

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
            expect(stored.reader.saturation).toBe(0);
        });
        expect(document.querySelector('.reader-area')).toHaveStyle({ '--reader-saturation': '0%' });

        fireEvent.change(saturation, { target: { value: '50' } });
        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
            expect(stored.reader.saturation).toBe(50);
        });
    });

    it('does not navigate past the latest chapter', async () => {
        const user = userEvent.setup();

        server.use(
            http.get('*/api/titles/:id', ({ params }) =>
                HttpResponse.json({
                    data: { id: params.id as string, name: 'Berserk', latestChapterNumber: '6', chaptersCount: 6 },
                    success: true,
                }),
            ),
        );

        renderChapter('2', '6');
        await screen.findByText('Berserk');

        await user.click(screen.getByRole('button', { name: /próximo capítulo/i }));

        expect(screen.getAllByText(/cap\. 6/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/cap\. 7/i)).not.toBeInTheDocument();
    });

    it('navigates to the next chapter when below the latest', async () => {
        const user = userEvent.setup();

        server.use(
            http.get('*/api/titles/:id', ({ params }) =>
                HttpResponse.json({
                    data: { id: params.id as string, name: 'Berserk', latestChapterNumber: '6', chaptersCount: 6 },
                    success: true,
                }),
            ),
        );

        renderChapter('2', '5');
        await screen.findByText('Berserk');

        await user.click(within(screen.getByRole('toolbar')).getByRole('button', { name: /próximo capítulo/i }));

        expect(await screen.findAllByText(/cap\. 6/i)).not.toHaveLength(0);
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

import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { createTestQueryClient, TestProviders } from '@/test/helpers/renderWithProviders';
import { server } from '@/test/mocks/server';
import { persistSession, clearSession } from '@shared/service/session';
import TitleDetails from '../TitleDetails';

const mockTitle = {
    id: '1',
    type: 'MANGA',
    cover: '/covers/berserk.jpg',
    name: 'Berserk',
    synopsis: 'Um guerreiro solitário.',
    genres: ['Seinen', 'Dark Fantasy'],
    chapters: [],
    popularity: 'HIGH',
    ratingAverage: 4.9,
    ratingCount: 14820,
    adult: false,
    status: 'ongoing',
    author: 'Kentaro Miura',
    artist: 'Kentaro Miura',
    publisher: 'White Fox',
    authors: [
        { authorId: 1, name: 'Kentaro Miura', slug: 'kentaro-miura', role: 'AUTHOR' },
        { authorId: 1, name: 'Kentaro Miura', slug: 'kentaro-miura', role: 'ARTIST' },
    ],
    publishers: [{ publisherId: 1, name: 'White Fox', slug: 'white-fox' }],
    chaptersCount: 370,
    createdAt: '1989-08-25T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const wrapPage = <T,>(content: T[]) => ({
    data: {
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: content.length > 0 ? 1 : 0,
        last: true,
    },
    success: true,
});

beforeEach(() => {
    server.use(
        http.get('*/api/titles/:id', ({ params }) => {
            if (params.id === 'not-a-number') {
                return new HttpResponse(null, { status: 404 });
            }
            return HttpResponse.json({
                data: { ...mockTitle, id: params.id as string },
                success: true,
            });
        }),
        http.get('*/api/titles/:id/chapters', () => HttpResponse.json(wrapPage([]))),
        http.get('*/api/reviews/title/:id', () => HttpResponse.json(wrapPage([]))),
        http.get('*/api/reviews/title/:id/average', () =>
            HttpResponse.json({
                data: { average: 4.9, count: 14820 },
                success: true,
            }),
        ),
        http.get('*/api/reviews/title/:id/distribution', () =>
            HttpResponse.json({
                data: { star1: 200, star2: 300, star3: 900, star4: 2700, star5: 10720, total: 14820 },
                success: true,
            }),
        ),
        http.get('*/api/groups/title/:id', () => HttpResponse.json(wrapPage([]))),
        http.get('*/api/comments/title/:id', () => HttpResponse.json(wrapPage([]))),
        http.get('*/api/stores/title/:id', () => HttpResponse.json(wrapPage([]))),
    );
});

const renderWithId = (titleId: string) => {
    const client = createTestQueryClient();
    return render(
        <TestProviders client={client}>
            <MemoryRouter initialEntries={[`/titles/${titleId}`]}>
                <Routes>
                    <Route path="/titles/:titleId" element={<TitleDetails />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );
};

describe('TitleDetails', () => {
    it('renders title heading after data loads', async () => {
        renderWithId('1');
        expect(await screen.findByRole('heading', { name: /berserk/i })).toBeInTheDocument();
    });

    it('renders author after data loads', async () => {
        renderWithId('1');
        expect(await screen.findByText(/kentaro miura/i)).toBeInTheDocument();
    });

    it('renders main landmark', async () => {
        renderWithId('1');
        // Aguarda o conteúdo carregar (o skeleton também usa <main>, então
        // assertamos após o heading para pegar o landmark do estado final).
        await screen.findByRole('heading', { name: /berserk/i });
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders Capítulos tab active by default', async () => {
        renderWithId('1');
        const tab = await screen.findByRole('tab', { name: /capítulos/i });
        expect(tab).toHaveAttribute('aria-selected', 'true');
    });

    it('renders all 6 tabs', async () => {
        renderWithId('1');
        expect(await screen.findByRole('tab', { name: /capítulos/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /resenhas/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /comentários/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /grupos/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /lojas/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /sobre/i })).toBeInTheDocument();
    });

    it('switches to Lojas tab and fetches stores by title', async () => {
        const user = userEvent.setup();
        renderWithId('1');
        await user.click(await screen.findByRole('tab', { name: /lojas/i }));
        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /lojas/i })).toHaveAttribute('aria-selected', 'true');
        });
    });

    it('shows not-found state with home and catalog buttons for missing title', async () => {
        renderWithId('not-a-number');
        expect(await screen.findByText(/obra não encontrada/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ir para o início/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /explorar catálogo/i })).toBeInTheDocument();
    });

    it('switches to Resenhas tab', async () => {
        const user = userEvent.setup();
        renderWithId('1');
        await user.click(await screen.findByRole('tab', { name: /resenhas/i }));
        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /resenhas/i })).toHaveAttribute('aria-selected', 'true');
        });
    });

    it('shows login prompt on Resenhas tab when logged out', async () => {
        renderWithId('1');
        await screen.findByRole('tab', { name: /resenhas/i });
        const user = userEvent.setup();
        await user.click(screen.getByRole('tab', { name: /resenhas/i }));
        // Deslogado: mostra prompt de login (Entrar / Criar conta); clicar navega, não abre modal
        expect(await screen.findByText(/entre para avaliar/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    });

    it('shows genre badges', async () => {
        renderWithId('1');
        expect(await screen.findByText('Seinen')).toBeInTheDocument();
    });

    it('renders the library action button', async () => {
        renderWithId('1');
        // Botão overlay de salvar foi removido; resta o CTA "Adicionar" na barra de ações
        expect(await screen.findByRole('button', { name: /adicionar/i })).toBeInTheDocument();
    });

    it('cover poster opens the lightbox (botão "Ampliar capa")', async () => {
        renderWithId('1');
        const cover = await screen.findByRole('button', { name: /ampliar capa/i });
        const user = userEvent.setup();
        await user.click(cover);
        // ImageLightbox abre como dialog
        expect(await screen.findByRole('dialog', { name: /berserk/i })).toBeInTheDocument();
    });

    it('shows not-found state for invalid id', async () => {
        renderWithId('not-a-number');
        expect(await screen.findByText(/obra não encontrada/i)).toBeInTheDocument();
    });

    it('renders another title for a different id', async () => {
        server.use(
            http.get('*/api/titles/2', () =>
                HttpResponse.json({
                    data: {
                        ...mockTitle,
                        id: '2',
                        name: 'One Piece',
                        author: 'Eiichiro Oda',
                    },
                    success: true,
                }),
            ),
        );
        renderWithId('2');
        expect(await screen.findByRole('heading', { name: /one piece/i })).toBeInTheDocument();
    });

    it('switches to Sobre tab and shows synopsis heading', async () => {
        const user = userEvent.setup();
        renderWithId('1');
        await user.click(await screen.findByRole('tab', { name: /sobre/i }));
        await waitFor(() => {
            expect(screen.getByText(/sinopse completa/i)).toBeInTheDocument();
        });
    });

    it('shows author, artist and publisher credits on the Sobre tab', async () => {
        const user = userEvent.setup();
        renderWithId('1');
        await user.click(await screen.findByRole('tab', { name: /sobre/i }));
        await waitFor(() => {
            expect(screen.getByText(/ficha técnica/i)).toBeInTheDocument();
        });
        expect(screen.getByText('Autor:')).toBeInTheDocument();
        expect(screen.getByText('Artista:')).toBeInTheDocument();
        expect(screen.getByText('Editora:')).toBeInTheDocument();
        expect(screen.getAllByText('Kentaro Miura').length).toBeGreaterThan(0);
        expect(screen.getByText('White Fox')).toBeInTheDocument();
    });

    it('renders empty chapter state when no chapters returned', async () => {
        renderWithId('1');
        await screen.findByRole('heading', { name: /berserk/i });
        expect(await screen.findByText(/nenhum capítulo encontrado/i)).toBeInTheDocument();
    });

    describe('recordView (histórico de visualização)', () => {
        afterEach(() => clearSession());

        it('registra a visualização quando logado', async () => {
            persistSession({ userId: 'u1', name: 'User', email: 'user@test.dev', role: 'MEMBER' });
            let called = false;
            let configLoaded = false;
            server.use(
                http.get('*/api/behavior-events/config', () => {
                    configLoaded = true;
                    return HttpResponse.json({
                        data: {
                            enabled: true,
                            titleViewSeconds: 0,
                            bounceMinSeconds: 0,
                            chapterStartSeconds: 10,
                            chapterCompletionPercent: 90,
                            maxBatchSize: 100,
                        },
                        success: true,
                    });
                }),
                http.post('*/api/users/me/history', () => {
                    called = true;
                    return new HttpResponse(null, { status: 204 });
                }),
            );

            const view = renderWithId('1');
            await screen.findByRole('heading', { name: /berserk/i });
            await waitFor(() => expect(configLoaded).toBe(true));
            view.unmount();

            await waitFor(() => expect(called).toBe(true));
        });

        it('não registra a visualização quando deslogado', async () => {
            let called = false;
            server.use(http.post('*/api/users/me/history', () => {
                called = true;
                return new HttpResponse(null, { status: 204 });
            }));

            renderWithId('1');
            await screen.findByRole('heading', { name: /berserk/i });

            await new Promise(resolve => setTimeout(resolve, 50));
            expect(called).toBe(false);
        });
    });
});

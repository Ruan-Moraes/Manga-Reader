import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import { renderWithProviders, TestProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { showInfoToast } from '@shared/service/util/toastService';
import type { Group } from '@entities/group';
import GroupProfile from '../GroupProfile';

const wrap = <T,>(data: T) => ({ data, success: true });

const getStoredSessionMock = vi.fn<() => { accessToken: string; userId: string } | null>(() => null);

vi.mock('@shared/service/session', async importOriginal => ({
    ...(await importOriginal<typeof import('@shared/service/session')>()),
    getStoredSession: () => getStoredSessionMock(),
}));

vi.mock('@shared/service/util/toastService');

const MOCK_GROUP: Group = {
    id: '1',
    name: 'Scan Brasileiro',
    username: 'scan-br',
    logo: '',
    banner: '',
    description: 'Grupo de tradução BR.',
    website: 'https://scan-br.example',
    totalTitles: 12,
    foundedYear: 2019,
    platformJoinedAt: '2020-01-01',
    status: 'active',
    members: [
        {
            id: 'm1',
            name: 'akira_scan',
            avatar: '',
            bio: '',
            role: 'Líder',
            joinedAt: '2020-01-01',
            groups: [{ id: '1', name: 'Scan Brasileiro' }],
            recentPosts: [],
        },
    ],
    supporters: [],
    genres: ['Ação'],
    focusTags: ['shonen'],
    rating: 4.7,
    popularity: 90,
    translatedWorks: [],
    translatedTitleIds: [],
};

vi.mock('@entities/group', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/group')>();
    return {
        ...actual,
        useGroupDetails: () => ({ group: MOCK_GROUP, isLoading: false }),
    };
});

const setup = () => renderWithProviders(<GroupProfile />);

// toggle() depende do :groupId real da rota (usado para chamar a API) — os
// testes anteriores dispensam isso pois `useGroupDetails` é mockado.
const setupWithRoute = () =>
    render(
        <TestProviders>
            <MemoryRouter initialEntries={[`/groups/${MOCK_GROUP.id}`]}>
                <Routes>
                    <Route path="/groups/:groupId" element={<GroupProfile />} />
                </Routes>
            </MemoryRouter>
        </TestProviders>,
    );

describe('GroupProfile', () => {
    it('axe', async () => {
        const { container } = renderWithProviders(<GroupProfile />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders group name heading', () => {
        setup();
        expect(screen.getByRole('heading', { name: /scan brasileiro/i })).toBeInTheDocument();
    });

    it('shows group handle', () => {
        setup();
        expect(screen.getAllByText(/@scan-br/).length).toBeGreaterThan(0);
    });

    it('renders group tabs (sobre, obras, equipe)', () => {
        setup();
        expect(screen.getByRole('button', { name: /^sobre$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^obras$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^equipe$/i })).toBeInTheDocument();
    });

    it('switches to team tab', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('button', { name: /^equipe$/i }));

        expect(screen.getByText('akira_scan')).toBeInTheDocument();
    });

    it('shows follow button', () => {
        setup();
        expect(screen.getByRole('button', { name: /seguir grupo/i })).toBeInTheDocument();
    });

    describe('seguir grupo', () => {
        beforeEach(() => {
            getStoredSessionMock.mockReset().mockReturnValue(null);
        });

        it('logado: clica em seguir, chama a API e reflete o estado', async () => {
            getStoredSessionMock.mockReturnValue({ accessToken: 'token', userId: 'u1' });
            server.use(
                http.post(`*${API_URLS.GROUPS}/1/support`, () =>
                    HttpResponse.json(wrap({ ...MOCK_GROUP, supporters: [{ id: 'u1', name: 'Eu', avatar: '', joinedAt: '2020-01-01' }] })),
                ),
            );

            const user = userEvent.setup();
            setupWithRoute();

            await user.click(screen.getByRole('button', { name: /seguir grupo/i }));

            await waitFor(() => expect(screen.getByRole('button', { name: /^seguindo$/i })).toBeInTheDocument());
        });

        it('deslogado: clica em seguir e não altera o estado do botão', async () => {
            const user = userEvent.setup();
            setupWithRoute();

            const button = screen.getByRole('button', { name: /seguir grupo/i });
            await user.click(button);

            expect(screen.getByRole('button', { name: /seguir grupo/i })).toBeInTheDocument();
        });

        it('membro: botão mostra "Membro" e clique só avisa, sem chamar a API', async () => {
            getStoredSessionMock.mockReturnValue({ accessToken: 'token', userId: 'm1' }); // m1 = membro em MOCK_GROUP
            let calls = 0;
            server.use(
                http.post(`*${API_URLS.GROUPS}/1/support`, () => {
                    calls += 1;
                    return HttpResponse.json(wrap(MOCK_GROUP));
                }),
            );

            const user = userEvent.setup();
            setupWithRoute();

            const button = screen.getByRole('button', { name: /^membro$/i });
            await user.click(button);

            expect(calls).toBe(0);
            expect(showInfoToast).toHaveBeenCalledWith(expect.stringMatching(/já é membro/i));
        });
    });
});

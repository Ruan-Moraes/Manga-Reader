import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import Groups from '../Groups';
import type { Group, GroupMember } from '@entities/group';

const wrap = <T,>(data: T) => ({ data, success: true });

const getStoredSessionMock = vi.fn<() => { accessToken: string; userId: string } | null>(() => null);

vi.mock('@shared/service/session', async importOriginal => ({
    ...(await importOriginal<typeof import('@shared/service/session')>()),
    getStoredSession: () => getStoredSessionMock(),
}));

vi.mock('@shared/service/util/toastService');

const makeMembers = (count: number): GroupMember[] =>
    Array.from({ length: count }, (_, i) => ({
        id: `member-${i}`,
        name: `Membro ${i}`,
        avatar: '',
        bio: '',
        role: 'Tradutor(a)',
        joinedAt: '2020-01-01',
        groups: [],
        recentPosts: [],
    }));

const makeGroup = (overrides: Partial<Group> = {}): Group => ({
    id: '1',
    name: 'Default Group',
    username: 'default',
    logo: '',
    banner: '',
    description: '',
    website: '',
    totalTitles: 10,
    foundedYear: 2020,
    platformJoinedAt: '2020-01-01',
    status: 'active',
    members: [],
    supporters: [],
    genres: ['Shounen'],
    focusTags: [],
    rating: 4.0,
    popularity: 100,
    translatedWorks: [],
    translatedTitleIds: [],
    ...overrides,
});

const MOCK_GROUPS: Group[] = [
    makeGroup({
        id: '1',
        name: 'Scan Brasileiro',
        username: 'scan-br',
        status: 'active',
        popularity: 900,
        members: makeMembers(1240),
    }),
    makeGroup({
        id: '2',
        name: 'Grupo Otaku BR',
        username: 'otakubr',
        status: 'active',
        popularity: 800,
        members: makeMembers(3400),
    }),
    makeGroup({
        id: '3',
        name: 'Fansub Clássicos',
        username: 'fansubcl',
        status: 'hiatus',
        popularity: 600,
        members: makeMembers(870),
    }),
    makeGroup({
        id: '7',
        name: 'Wonder Scans',
        username: 'wonder',
        status: 'active',
        popularity: 750,
        members: makeMembers(1890),
    }),
];

const mGroups = {
    groups: MOCK_GROUPS,
    genres: ['Shounen'],
    isLoading: false,
};

vi.mock('@entities/group', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/group')>();
    return {
        ...actual,
        useGroups: ({ status, query }: { status: string; query?: string; genre?: string; sortBy?: string }) => {
            const q = query?.toLowerCase().trim() ?? '';
            const filtered = MOCK_GROUPS.filter(g => {
                if (status !== 'all' && g.status !== status) return false;
                if (q && !g.name.toLowerCase().includes(q)) return false;
                return true;
            });
            return {
                groups: filtered,
                genres: [],
                isLoading: mGroups.isLoading,
            };
        },
    };
});

beforeEach(() => {
    mGroups.isLoading = false;
});

const setup = () => renderWithProviders(<Groups />);

describe('Groups', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<Groups />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders heading', () => {
        setup();
        expect(screen.getByRole('heading', { name: /grupos/i })).toBeInTheDocument();
    });

    it('shows group cards', () => {
        setup();
        expect(screen.getByText('Scan Brasileiro')).toBeInTheDocument();
        expect(screen.getByText('Wonder Scans')).toBeInTheDocument();
    });

    it('renders search field', () => {
        setup();
        expect(screen.getByRole('textbox', { name: /buscar grupo/i })).toBeInTheDocument();
    });

    it('filters groups by search', async () => {
        const user = userEvent.setup();
        setup();

        const search = screen.getByRole('textbox', { name: /buscar grupo/i });
        await user.type(search, 'Wonder');

        expect(screen.getByText('Wonder Scans')).toBeInTheDocument();
        expect(screen.queryByText('Scan Brasileiro')).not.toBeInTheDocument();
    });

    // Os chips de status (Todos/Ativos/Hiato) foram removidos no redesign da
    // página — a listagem agora ordena via CatSortSelect.
    it('renders sort select with options', () => {
        setup();
        expect(screen.getByText(/mais seguidores/i)).toBeInTheDocument();
    });

    describe('seguir grupo (card)', () => {
        beforeEach(() => {
            getStoredSessionMock.mockReset().mockReturnValue(null);
        });

        it('logado: clica em seguir no card e reflete o estado', async () => {
            getStoredSessionMock.mockReturnValue({ accessToken: 'token', userId: 'u1' });
            server.use(
                http.post(`*${API_URLS.GROUPS}/1/support`, () =>
                    HttpResponse.json(wrap({ ...MOCK_GROUPS[0], supporters: [{ id: 'u1', name: 'Eu', avatar: '', joinedAt: '2020-01-01' }] })),
                ),
            );

            const user = userEvent.setup();
            setup();

            const card = screen.getByText('Scan Brasileiro').closest('[data-testid="group-card"]') as HTMLElement;
            await user.click(within(card).getByRole('button', { name: /^seguir$/i }));

            await waitFor(() => expect(within(card).getByRole('button', { name: /^seguindo$/i })).toBeInTheDocument());
        });

        it('membro: card mostra "Membro" e clique não chama a API', async () => {
            getStoredSessionMock.mockReturnValue({ accessToken: 'token', userId: 'member-0' }); // member-0 é membro de Scan Brasileiro
            let calls = 0;
            server.use(
                http.post(`*${API_URLS.GROUPS}/1/support`, () => {
                    calls += 1;
                    return HttpResponse.json(wrap(MOCK_GROUPS[0]));
                }),
            );

            const user = userEvent.setup();
            setup();

            const card = screen.getByText('Scan Brasileiro').closest('[data-testid="group-card"]') as HTMLElement;
            await user.click(within(card).getByRole('button', { name: /^membro$/i }));

            expect(calls).toBe(0);
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import Groups from '../Groups';
import type { Group } from '@entities/group';

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
        members: Array(1240).fill(null) as [],
    }),
    makeGroup({
        id: '2',
        name: 'Grupo Otaku BR',
        username: 'otakubr',
        status: 'active',
        popularity: 800,
        members: Array(3400).fill(null) as [],
    }),
    makeGroup({
        id: '3',
        name: 'Fansub Clássicos',
        username: 'fansubcl',
        status: 'hiatus',
        popularity: 600,
        members: Array(870).fill(null) as [],
    }),
    makeGroup({
        id: '7',
        name: 'Wonder Scans',
        username: 'wonder',
        status: 'active',
        popularity: 750,
        members: Array(1890).fill(null) as [],
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
});

import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import Home from '../Home';

const mockTitle = {
    id: '1',
    name: 'Berserk',
    author: 'K. Miura',
    cover: '',
    synopsis: 'Uma história épica.',
    genres: ['Seinen'],
    status: 'ONGOING',
    ratingAverage: 4.9,
    ratingCount: 1000,
    type: 'Manga',
    popularity: '1',
    adult: false,
    artist: 'K. Miura',
    publisher: 'Hakusensha',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
};

const mockTrendingTitle = {
    ...mockTitle,
    id: '2',
    name: 'Vagabond',
    author: 'T. Inoue',
};

vi.mock('@entities/catalog-filter', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/catalog-filter')>();
    return {
        ...actual,
        useFilterResults: () => ({
            data: { content: [mockTitle, mockTrendingTitle], totalElements: 2, totalPages: 1 },
            isLoading: false,
        }),
    };
});

vi.mock('@features/auth', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/auth')>();
    return {
        ...actual,
        useAuth: () => ({ isLoggedIn: false, user: null }),
    };
});

vi.mock('@features/library', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/library')>();
    return {
        ...actual,
        useSavedMangas: () => ({ items: [], loading: false }),
    };
});

vi.mock('@entities/forum', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/forum')>();
    return {
        ...actual,
        getForumTopics: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
        formatRelativeDate: (d: string) => d,
    };
});

vi.mock('@entities/group', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/group')>();
    return {
        ...actual,
        getGroups: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
    };
});

beforeAll(() => {
    vi.stubGlobal(
        'matchMedia',
        vi.fn().mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }),
    );
});

afterAll(() => vi.unstubAllGlobals());

describe('Home', () => {
    it('axe', async () => {
        const { container } = renderWithProviders(<Home />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders main landmark', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders trending section heading', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('heading', { name: /as histórias que estão ganhando força/i })).toBeInTheDocument();
    });

    it('renders the trending rank with high-contrast theme tokens', () => {
        renderWithProviders(<Home />);
        expect(screen.getByText('#1')).toHaveClass('bg-mr-accent', 'text-mr-on-accent');
    });

    it('renders releases section heading', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('heading', { name: /lançamentos da semana/i })).toBeInTheDocument();
    });

    it('renders community section heading', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('heading', { name: /o que estão discutindo/i })).toBeInTheDocument();
    });

    it('renders groups section heading', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('heading', { name: /grupos pra conhecer/i })).toBeInTheDocument();
    });

    it('renders skip-to-content link', () => {
        renderWithProviders(<Home />);
        expect(screen.getByText(/ir pro conteúdo/i)).toBeInTheDocument();
    });
});

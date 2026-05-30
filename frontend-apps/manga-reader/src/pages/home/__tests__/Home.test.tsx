import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
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
    rankingScore: 0.99,
    adult: false,
    artist: 'K. Miura',
    publisher: 'Hakusensha',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
};

vi.mock('@features/category', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/category')>();
    return {
        ...actual,
        useFilterResults: () => ({
            data: { content: [mockTitle], totalElements: 1, totalPages: 1 },
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

vi.mock('@features/group', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/group')>();
    return {
        ...actual,
        getGroups: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
    };
});

describe('Home', () => {
    it('renders main landmark', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders trending section heading', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('heading', { name: /em alta na comunidade/i })).toBeInTheDocument();
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

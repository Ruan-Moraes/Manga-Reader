import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

const mSearch = {
    isLoading: false,
    isError: false,
    data: undefined as unknown,
};

vi.mock('@entities/manga', () => ({
    useSearchTitles: () => mSearch,
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useSearchParams: () => [new URLSearchParams({ q: 'one piece' }), vi.fn()],
    };
});

vi.mock('@widgets/header/Header', () => ({ default: () => null }));
vi.mock('@widgets/footer/Footer', () => ({ default: () => null }));
vi.mock('@widgets/layouts/Main', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SearchResults from '../SearchResults';

describe('SearchResults route', () => {
    beforeEach(() => {
        mSearch.isLoading = false;
        mSearch.isError = false;
        mSearch.data = undefined;
    });

    it('mostra mensagem de erro quando isError=true', () => {
        mSearch.isError = true;

        renderWithProviders(<SearchResults />);

        expect(screen.getByText(/erro ao buscar/i)).toBeInTheDocument();
    });

    it('mostra empty state quando data.content vazio', () => {
        mSearch.data = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            last: true,
        };

        renderWithProviders(<SearchResults />);

        expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument();
    });

    it('renderiza títulos quando data.content presente', () => {
        mSearch.data = {
            content: [
                {
                    id: 't1',
                    name: 'One Piece',
                    author: 'Oda',
                    cover: 'cover.jpg',
                    ratingAverage: 4.8,
                    type: 'MANGA',
                    genres: ['Action', 'Adventure'],
                },
            ],
            totalElements: 1,
            totalPages: 1,
            last: true,
        };

        renderWithProviders(<SearchResults />);

        expect(screen.getAllByText(/one piece/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Oda')).toBeInTheDocument();
    });
});

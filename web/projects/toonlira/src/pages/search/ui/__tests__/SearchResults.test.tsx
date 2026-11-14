import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';

const mOverview = {
    isLoading: false,
    isError: false,
    data: undefined as unknown,
    refetch: vi.fn(),
};

const mSearch = {
    isLoading: false,
    isError: false,
    data: undefined as unknown,
    refetch: vi.fn(),
};

vi.mock('@features/search-catalog', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/search-catalog')>();
    return {
        ...actual,
        useGlobalSearchSuggestions: () => mOverview,
        useCatalogSearch: () => mSearch,
    };
});

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useSearchParams: () => [new URLSearchParams({ q: 'one piece' }), vi.fn()],
    };
});

vi.mock('@widgets/header/ui/Header', () => ({ default: () => null }));
vi.mock('@widgets/footer/ui/Footer', () => ({ default: () => null }));
vi.mock('@widgets/layouts/ui/Main', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SearchResults from '../SearchResults';

describe('SearchResults route', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<SearchResults />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    beforeEach(() => {
        mSearch.isLoading = false;
        mSearch.isError = false;
        mSearch.data = undefined;
        mOverview.isLoading = false;
        mOverview.isError = false;
        mOverview.data = undefined;
    });

    it('mostra mensagem de erro quando isError=true', () => {
        mOverview.isError = true;

        renderWithProviders(<SearchResults />);

        expect(screen.getByText(/erro ao buscar/i)).toBeInTheDocument();
    });

    it('mostra empty state quando data.content vazio', () => {
        mOverview.data = {
            sections: [],
            totalElements: 0,
        };

        renderWithProviders(<SearchResults />);

        expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument();
    });

    it('renderiza títulos quando data.content presente', () => {
        mOverview.data = {
            sections: [{
                type: 'TITLE',
                totalElements: 1,
                items: [{
                    id: 't1',
                    slug: null,
                    entityType: 'TITLE',
                    name: 'One Piece',
                    image: 'cover.jpg',
                    matchedBy: 'PRIMARY_NAME',
                    matchedText: 'One Piece',
                    roles: [],
                    workCount: 0,
                    titleType: 'MANGA',
                    titleStatus: 'ONGOING',
                    adult: false,
                    primaryContributor: 'Oda',
                    country: null,
                }],
            }],
            totalElements: 1,
        };

        renderWithProviders(<SearchResults />);

        expect(screen.getAllByText(/one piece/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Oda')).toBeInTheDocument();
    });
});

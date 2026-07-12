import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';

import CategoryFilters from '../CategoryFilters';

import type { Title } from '@entities/manga';
import type { Tag } from '@entities/catalog-filter';

const makeTitle = (overrides: Partial<Title> = {}): Title => ({
    id: '1',
    type: 'Manga',
    cover: '',
    name: 'Default',
    synopsis: '',
    genres: ['Shounen'],
    popularity: '100',
    ratingAverage: 4.5,
    ratingCount: 10,
    adult: false,
    status: 'ONGOING',
    author: 'Author',
    artist: 'Artist',
    publisher: 'Pub',
    authors: [],
    publishers: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
});

const MOCK_TAGS: Tag[] = [
    { value: 1, slug: 'SEINEN', label: 'Seinen' },
    { value: 2, slug: 'SHOUNEN', label: 'Shounen' },
    { value: 3, slug: 'ISEKAI', label: 'Isekai' },
];

const MOCK_TITLES: Title[] = [
    makeTitle({
        id: '1',
        name: 'Berserk',
        author: 'Miura',
        genres: ['Seinen'],
    }),
    makeTitle({
        id: '2',
        name: 'One Piece',
        author: 'Oda',
        genres: ['Shounen'],
    }),
];

vi.mock('@entities/catalog-filter', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/catalog-filter')>();

    return {
        ...actual,
        useTagsFetch: () => ({ data: MOCK_TAGS }),
        useFilterResults: () => ({
            data: { content: MOCK_TITLES, totalElements: 2, totalPages: 1 },
            isLoading: false,
        }),
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

const setup = () => renderWithProviders(<CategoryFilters />);

describe('CategoryFilters', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<CategoryFilters />);

        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders obra count and search field', () => {
        setup();

        expect(screen.getByPlaceholderText(/buscar obras/i)).toBeInTheDocument();
        expect(screen.getByText(/2 obras/i)).toBeInTheDocument();
    });

    it('filters by search query', async () => {
        const user = userEvent.setup();

        setup();

        const search = screen.getByPlaceholderText(/buscar obras/i);
        await user.type(search, 'Berserk');

        // Client-side filter on current page results — only Berserk remains
        expect(screen.getByText('Berserk')).toBeInTheDocument();
        expect(screen.queryByText('One Piece')).not.toBeInTheDocument();
    });

    it('renders genre checkboxes', () => {
        setup();

        expect(screen.getByRole('checkbox', { name: /seinen/i })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /shounen/i })).toBeInTheDocument();
    });

    it('selecting a genre adds active filter chip', async () => {
        const user = userEvent.setup();

        setup();

        const seinenCb = screen.getByRole('checkbox', { name: /seinen/i });
        await user.click(seinenCb);

        // Genre chip appears as a remove button
        const chips = screen.getAllByRole('button', { name: /seinen/i });

        expect(chips.length).toBeGreaterThan(0);
    });

    it('shows layout toggle controls', () => {
        setup();

        expect(screen.getByRole('radio', { name: /grade/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /lista/i })).toBeInTheDocument();
    });
});

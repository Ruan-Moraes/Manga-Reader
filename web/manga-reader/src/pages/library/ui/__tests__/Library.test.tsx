import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import Library from '../Library';
import type { SavedMangaItem } from '@features/library';

const makeManga = (overrides: Partial<SavedMangaItem> = {}): SavedMangaItem => ({
    titleId: '1',
    name: 'Berserk',
    cover: '',
    type: 'Manga',
    list: 'Lendo',
    savedAt: '2024-01-01T00:00:00Z',
    ...overrides,
});

const ITEMS: SavedMangaItem[] = [
    makeManga({
        titleId: '1',
        name: 'Berserk',
        list: 'Lendo',
        savedAt: '2024-01-12T00:00:00Z',
    }),
    makeManga({
        titleId: '2',
        name: 'One Piece',
        list: 'Lendo',
        savedAt: '2024-01-11T00:00:00Z',
    }),
    makeManga({
        titleId: '3',
        name: 'Attack on Titan',
        list: 'Concluído',
        savedAt: '2024-01-10T00:00:00Z',
    }),
    makeManga({
        titleId: '4',
        name: 'Fullmetal Alch.',
        list: 'Concluído',
        savedAt: '2024-01-09T00:00:00Z',
    }),
    makeManga({
        titleId: '5',
        name: 'Vagabond',
        list: 'Quero Ler',
        savedAt: '2024-01-08T00:00:00Z',
    }),
    makeManga({
        titleId: '6',
        name: 'Chainsaw Man',
        list: 'Lendo',
        savedAt: '2024-01-07T00:00:00Z',
    }),
    makeManga({
        titleId: '7',
        name: 'Vinland Saga',
        list: 'Concluído',
        savedAt: '2024-01-06T00:00:00Z',
    }),
    makeManga({
        titleId: '8',
        name: 'Blue Lock',
        list: 'Lendo',
        savedAt: '2024-01-05T00:00:00Z',
    }),
    makeManga({
        titleId: '9',
        name: 'Dungeon Meshi',
        list: 'Concluído',
        savedAt: '2024-01-04T00:00:00Z',
    }),
    makeManga({
        titleId: '10',
        name: 'Spy x Family',
        list: 'Lendo',
        savedAt: '2024-01-03T00:00:00Z',
    }),
    makeManga({
        titleId: '11',
        name: 'Homunculus',
        list: 'Quero Ler',
        savedAt: '2024-01-02T00:00:00Z',
    }),
    makeManga({
        titleId: '12',
        name: 'Frieren',
        list: 'Quero Ler',
        savedAt: '2024-01-01T00:00:00Z',
    }),
];

const mSaved = {
    items: ITEMS,
    counts: { total: 12, lendo: 5, queroLer: 3, concluido: 4 },
    activeTab: 'Todos' as string,
    loading: false,
    error: null,
    hasMore: false,
    changeTab: vi.fn(),
    loadMore: vi.fn(),
    changeList: vi.fn(),
    removeFromSaved: vi.fn(),
    toggleFavorite: vi.fn(),
    isSaved: vi.fn(() => false),
    retry: vi.fn(),
};

vi.mock('@features/library', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/library')>();
    return {
        ...actual,
        useSavedMangas: () => mSaved,
    };
});

beforeEach(() => {
    mSaved.items = ITEMS;
    mSaved.counts = { total: 12, lendo: 5, queroLer: 3, concluido: 4 };
    mSaved.activeTab = 'Todos';
    mSaved.loading = false;
    mSaved.changeTab.mockClear();
});

const setup = () => renderWithProviders(<Library />);

describe('Library', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<Library />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders heading and total count', () => {
        setup();
        expect(screen.getByRole('heading', { name: /minha biblioteca/i })).toBeInTheDocument();
        expect(screen.getByText(/12 obras/i)).toBeInTheDocument();
    });

    it('renders tabs for each status', () => {
        setup();
        expect(screen.getByRole('tab', { name: /todas/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /lendo/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /concluídas/i })).toBeInTheDocument();
    });

    it('filters by status tab — clicking completed tab calls changeTab', async () => {
        const user = userEvent.setup();
        setup();

        const completedTab = screen.getByRole('tab', { name: /concluídas/i });
        await user.click(completedTab);

        expect(mSaved.changeTab).toHaveBeenCalledWith('Concluído');
    });

    it('shows empty state when search yields no results', async () => {
        const user = userEvent.setup();
        setup();

        const search = screen.getByRole('searchbox');
        await user.type(search, 'xyz-inexistente-9999');

        expect(screen.getByText(/nenhuma obra/i)).toBeInTheDocument();
    });

    it('switches layout via SegmentedControl', async () => {
        const user = userEvent.setup();
        setup();

        const listBtn = screen.getByRole('radio', { name: /lista/i });
        await user.click(listBtn);

        expect(listBtn).toHaveAttribute('aria-checked', 'true');
    });
});

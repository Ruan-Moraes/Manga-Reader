import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import News from '../News';
import type { NewsItem } from '@entities/news';

const makeItem = (overrides: Partial<NewsItem> = {}): NewsItem => ({
    id: '1',
    title: 'Default title',
    subtitle: '',
    excerpt: 'Excerpt',
    content: [],
    coverImage: '',
    gallery: [],
    source: 'Internal',
    sourceLogo: '',
    category: 'Principais',
    tags: [],
    author: {
        id: 'a1',
        name: 'Author',
        avatar: '',
        role: 'editor',
        profileLink: '',
    },
    publishedAt: '2024-05-01T10:00:00Z',
    readTime: 3,
    views: 1000,
    commentsCount: 5,
    trendingScore: 0.8,
    reactions: { like: 10, excited: 5, sad: 0, surprised: 2 },
    comments: [],
    ...overrides,
});

const MOCK_HERO = makeItem({
    id: '1',
    title: 'Manga Reader v3.0 — O que muda na maior atualização',
    category: 'Principais',
    isFeatured: true,
});
const MOCK_FEED: NewsItem[] = [
    makeItem({
        id: '2',
        title: 'Novo recorde: 50 mil leitores simultâneos',
        category: 'Principais',
    }),
    makeItem({
        id: '3',
        title: 'Anime de Chainsaw Man confirmada para 2026',
        category: 'Lançamentos',
    }),
];

const mNews = {
    tabs: [
        { id: 'featured', labelKey: 'page.tabs.featured' },
        { id: 'releases', labelKey: 'page.tabs.releases' },
        { id: 'adaptations', labelKey: 'page.tabs.adaptations' },
        { id: 'industry', labelKey: 'page.tabs.industry' },
        { id: 'events', labelKey: 'page.tabs.events' },
        { id: 'curiosities', labelKey: 'page.tabs.curiosities' },
    ] as const,
    myNewsTabs: [
        { id: 'saved', labelKey: 'page.tabs.saved' },
        { id: 'read', labelKey: 'page.tabs.read' },
        { id: 'recommended', labelKey: 'page.tabs.recommended' },
    ] as const,
    activeTab: 'featured' as string,
    setActiveTab: vi.fn((v: string) => {
        mNews.activeTab = v;
    }),
    query: '',
    setQuery: vi.fn(),
    period: 'all' as const,
    setPeriod: vi.fn(),
    source: 'all' as string,
    setSource: vi.fn(),
    sort: 'recent' as const,
    setSort: vi.fn(),
    sources: ['all'],
    isLoading: false,
    showMobileFilters: false,
    toggleMobileFilters: vi.fn(),
    heroNews: MOCK_HERO,
    feedNews: MOCK_FEED,
    nonReadCount: 3,
    sidebarMostRead: [],
    hasMoreItems: false,
    loadMore: vi.fn(),
    toggleSaved: vi.fn(),
    markAsRead: vi.fn(),
    isRead: vi.fn(() => false),
    savedNews: [] as string[],
    readNews: [] as string[],
    myNewsTab: 'saved' as const,
    setMyNewsTab: vi.fn(),
};

vi.mock('@entities/news', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/news')>();
    return {
        ...actual,
        useNews: () => mNews,
    };
});

beforeEach(() => {
    mNews.activeTab = 'featured';
    mNews.heroNews = MOCK_HERO;
    mNews.feedNews = MOCK_FEED;
    mNews.isLoading = false;
    mNews.setActiveTab.mockClear();
});

const setup = () => renderWithProviders(<News />);

describe('News', () => {
    it('renders section heading', () => {
        setup();
        expect(screen.getByRole('heading', { name: /rolou essa semana/i })).toBeInTheDocument();
    });

    it('shows news list', () => {
        setup();
        expect(screen.getByText(/manga reader v3\.0/i)).toBeInTheDocument();
    });

    it('renders category tabs (Principais, Lançamentos, Adaptações)', () => {
        setup();
        expect(screen.getByRole('tab', { name: /principais/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /lançamentos/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /adaptações/i })).toBeInTheDocument();
    });

    it('filters by Lançamentos tab', async () => {
        const user = userEvent.setup();
        setup();

        const launchTab = screen.getByRole('tab', { name: /lançamentos/i });
        await user.click(launchTab);

        expect(mNews.setActiveTab).toHaveBeenCalledWith('releases');
    });
});

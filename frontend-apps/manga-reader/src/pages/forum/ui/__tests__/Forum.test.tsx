import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Forum from '../Forum';
import type { ForumTopic } from '@entities/forum';

const mockTopic = (overrides: Partial<ForumTopic> = {}): ForumTopic => ({
    id: '1',
    title: 'Default',
    content: '',
    category: 'Geral',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    lastActivityAt: '2024-01-01T00:00:00Z',
    viewCount: 100,
    replyCount: 5,
    likeCount: 10,
    isPinned: false,
    isLocked: false,
    isSolved: false,
    author: {
        id: 'a1',
        name: 'user',
        avatar: '',
        role: 'member',
        postCount: 1,
        joinedAt: '2024-01-01',
    },
    ...overrides,
});

const MOCK_TOPICS: ForumTopic[] = [
    mockTopic({
        id: '1',
        title: 'Regras do fórum — leia antes de postar',
        category: 'Geral',
        isPinned: true,
    }),
    mockTopic({
        id: '2',
        title: 'Poll: Qual o melhor arco de One Piece até agora?',
        category: 'Geral',
    }),
    mockTopic({
        id: '3',
        title: 'Teoria: O que aconteceu com o pai do Guts?',
        category: 'Teorias',
    }),
];

const mForum = {
    activeCategory: 'all' as 'all' | 'Geral' | 'Teorias',
    sort: 'recent' as const,
    query: '',
    page: 1,
    setPage: vi.fn(),
    allTopics: MOCK_TOPICS,
    topics: MOCK_TOPICS,
    totalPages: 1,
    crossLanguage: false,
    toggleCrossLanguage: vi.fn(),
    updateCategory: vi.fn((cat: 'all' | 'Geral' | 'Teorias') => {
        mForum.activeCategory = cat;
    }),
    updateSort: vi.fn(),
    updateQuery: vi.fn(),
};

vi.mock('@entities/forum', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/forum')>();
    return {
        ...actual,
        useForumPage: () => mForum,
    };
});

beforeEach(() => {
    mForum.activeCategory = 'all';
    mForum.allTopics = MOCK_TOPICS;
    mForum.topics = MOCK_TOPICS;
    mForum.totalPages = 1;
    mForum.updateCategory.mockClear();
});

const setup = () => renderWithProviders(<Forum />);

describe('Forum', () => {
    it('renders Fórum heading', () => {
        setup();
        const headings = screen.getAllByRole('heading', { name: /fórum/i });
        expect(headings.length).toBeGreaterThan(0);
    });

    it('renders topic list', () => {
        setup();
        expect(screen.getByText(/regras do fórum/i)).toBeInTheDocument();
        expect(screen.getByText(/poll: qual o melhor arco/i)).toBeInTheDocument();
    });

    it('has Novo tópico button in SectionHeader action', () => {
        setup();
        expect(screen.getByRole('button', { name: /novo tópico/i })).toBeInTheDocument();
    });

    it('filters by category', async () => {
        const user = userEvent.setup();
        setup();

        const teoriasCat = screen.getByRole('button', { name: /^teorias$/i });
        await user.click(teoriasCat);

        expect(mForum.updateCategory).toHaveBeenCalledWith('Teorias');
    });

    it('resets to all when Todos selected', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('button', { name: /^teorias$/i }));
        const allBtn = screen.getByRole('button', { name: /^todas$/i });
        await user.click(allBtn);

        expect(mForum.updateCategory).toHaveBeenCalledWith('all');
    });
});

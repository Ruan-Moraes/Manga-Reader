import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { CommentSortProvider } from '@entities/comment';
import { UserModalProvider } from '@entities/user';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import NewsDetails from '../NewsDetails';

const MOCK_NEWS = {
    id: '1',
    title: 'Manga Reader v3.0 — nova versão',
    subtitle: 'Subtítulo da notícia',
    excerpt: 'Resumo da notícia aqui.',
    content: ['Parágrafo 1', 'Parágrafo 2'],
    coverImage: '',
    gallery: [],
    source: 'Redação MR',
    sourceLogo: '',
    category: 'app' as const,
    tags: ['update'],
    author: { name: 'Admin', avatar: '', bio: '' },
    publishedAt: '2026-05-01',
    readTime: 3,
    views: 1200,
    commentsCount: 5,
    trendingScore: 90,
    reactions: { likes: 0, hearts: 0, fires: 0, claps: 0 },
    comments: [],
};

vi.mock('@entities/news', async () => {
    const actual = await vi.importActual<typeof import('@entities/news')>('@entities/news');
    return {
        ...actual,
        useNewsDetails: () => ({
            news: MOCK_NEWS,
            commentSort: 'top',
            setCommentSort: vi.fn(),
            showSpoilers: false,
            setShowSpoilers: vi.fn(),
            readingProgress: 0,
            relatedNews: [],
            sortedComments: [],
        }),
    };
});

const renderNews = (newsId = '1') => {
    const client = createTestQueryClient();
    return render(
        <QueryClientProvider client={client}>
            <UserModalProvider>
                <CommentSortProvider>
                    <MemoryRouter initialEntries={[`/news/${newsId}`]}>
                        <Routes>
                            <Route path="/news/:newsId" element={<NewsDetails />} />
                        </Routes>
                    </MemoryRouter>
                </CommentSortProvider>
            </UserModalProvider>
        </QueryClientProvider>,
    );
};

describe('NewsDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders article title', () => {
        renderNews();
        expect(screen.getByText(/manga reader v3\.0/i)).toBeInTheDocument();
    });

    it('renders article content', () => {
        renderNews();
        expect(screen.getByText('Parágrafo 1')).toBeInTheDocument();
    });

    it('renders author name', () => {
        renderNews();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });
});

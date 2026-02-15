export type NewsCategory =
    | 'Principais'
    | 'Lançamentos'
    | 'Adaptações'
    | 'Indústria'
    | 'Entrevistas'
    | 'Eventos'
    | 'Curiosidades'
    | 'Mercado'
    | 'Internacional';

export type NewsReaction = {
    like: number;
    excited: number;
    sad: number;
    surprised: number;
};

export type NewsComment = {
    id: string;
    user: string;
    avatar: string;
    content: string;
    createdAt: string;
    likes: number;
    spoiler?: boolean;
    replies?: Array<{
        id: string;
        user: string;
        content: string;
        createdAt: string;
    }>;
};

export type NewsAuthor = {
    id: string;
    name: string;
    avatar: string;
    role: string;
    profileLink: string;
};

export type NewsItem = {
    id: string;
    title: string;
    subtitle: string;
    excerpt: string;
    content: string[];
    coverImage: string;
    gallery: string[];
    source: string;
    sourceLogo: string;
    category: NewsCategory;
    tags: string[];
    author: NewsAuthor;
    publishedAt: string;
    updatedAt?: string;
    readTime: number;
    views: number;
    commentsCount: number;
    trendingScore: number;
    isExclusive?: boolean;
    isFeatured?: boolean;
    videoUrl?: string;
    technicalSheet?: Record<string, string>;
    reactions: NewsReaction;
    comments: NewsComment[];
};

export type NewsFilter = {
    tab: 'all' | 'Principais' | NewsCategory;
    query: string;
    period: 'all' | 'today' | 'week' | 'month';
    source: 'all' | string;
    sort: 'recent' | 'most-read' | 'trending';
};

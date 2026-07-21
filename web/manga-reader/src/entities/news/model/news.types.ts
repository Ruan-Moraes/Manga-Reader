export type NewsCategoryOption = { value: string; label: string };
export type NewsCategory = NewsCategoryOption | string;
export type NewsStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED';
export type NewsSort = 'recent' | 'most-read' | 'trending';
export type NewsPeriod = 'all' | 'today' | 'week' | 'month';
export type NewsReaction = { like: number; excited: number; sad: number; surprised: number };
export type NewsAuthor = { id: string; name: string; avatar: string; role: string; profileLink: string };
export type NewsSeo = { title: string; description: string; keywords: string[] };
export type NewsComment = { id: string; user: string; avatar?: string; content: string; createdAt: string; likes?: number; spoiler?: boolean; replies?: NewsComment[] };

export type NewsSummary = {
    id: string; slug?: string; title: string; excerpt: string;
    coverImage: string | null; coverAlt?: string; category: NewsCategory | null;
    tags: string[]; author: NewsAuthor | null; publishedAt: string;
    readTime: number; views: number; commentsCount: number; trendingScore: number;
    isExclusive?: boolean; isFeatured?: boolean;
};

export type NewsItem = NewsSummary & {
    subtitle: string; content: string[]; gallery: string[];
    source: string | null; sourceLogo: string | null; updatedAt?: string | null;
    videoUrl?: string | null; technicalSheet?: Record<string, string>;
    reactions: NewsReaction; seo?: NewsSeo; comments?: NewsComment[];
};

export type NewsQuery = {
    page: number; size?: number; q?: string; category?: string;
    period?: NewsPeriod; sort?: NewsSort;
};

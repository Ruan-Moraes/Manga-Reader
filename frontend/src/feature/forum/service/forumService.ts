import { simulateDelay } from '@shared/service/mockApi';
import { mockForumTopics } from '@mock/data/forums';

import type {
    ForumCategory,
    ForumFilter,
    ForumSort,
    ForumTopic,
} from '../type/forum.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const forumCategories: ForumCategory[] = [
    'Geral',
    'Recomendações',
    'Spoilers',
    'Suporte',
    'Off-topic',
    'Teorias',
    'Fanart',
    'Notícias',
];

export const forumSortOptions: { value: ForumSort; label: string }[] = [
    { value: 'recent', label: 'Mais recentes' },
    { value: 'popular', label: 'Mais populares' },
    { value: 'most-replies', label: 'Mais respostas' },
    { value: 'oldest', label: 'Mais antigos' },
];

export const TOPICS_PER_PAGE = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const matchesQuery = (topic: ForumTopic, query: string): boolean => {
    const haystack =
        `${topic.title} ${topic.content} ${topic.tags.join(' ')} ${topic.author.name}`.toLowerCase();
    return haystack.includes(query);
};

const sortTopics = (topics: ForumTopic[], sort: ForumSort): ForumTopic[] => {
    const pinned = topics.filter(t => t.isPinned);
    const unpinned = topics.filter(t => !t.isPinned);

    const sorted = [...unpinned].sort((a, b) => {
        switch (sort) {
            case 'popular':
                return b.likeCount - a.likeCount;
            case 'most-replies':
                return b.replyCount - a.replyCount;
            case 'oldest':
                return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                );
            case 'recent':
            default:
                return (
                    new Date(b.lastActivityAt).getTime() -
                    new Date(a.lastActivityAt).getTime()
                );
        }
    });

    return [...pinned, ...sorted];
};

// ---------------------------------------------------------------------------
// Public API — Async (simulam chamadas ao backend)
// ---------------------------------------------------------------------------

export const getForumTopics = async (
    filters?: ForumFilter,
): Promise<ForumTopic[]> => {
    await simulateDelay();

    if (!filters) return sortTopics(mockForumTopics, 'recent');

    return filterForumTopics(filters);
};

export const getForumTopicById = async (
    id: string,
): Promise<ForumTopic | undefined> => {
    await simulateDelay();
    return mockForumTopics.find(t => t.id === id);
};

export const getForumCategories = async (): Promise<ForumCategory[]> => {
    await simulateDelay(100);
    return forumCategories;
};

// ---------------------------------------------------------------------------
// Sync filter — usado pelos componentes de rota em useMemo
// ---------------------------------------------------------------------------

export const filterForumTopics = (filters: ForumFilter): ForumTopic[] => {
    const {
        category = 'all',
        sort = 'recent',
        query = '',
        onlyPinned = false,
        onlySolved = false,
    } = filters;

    const normalizedQuery = query.trim().toLowerCase();

    const filtered = mockForumTopics.filter(topic => {
        if (category !== 'all' && topic.category !== category) return false;
        if (onlyPinned && !topic.isPinned) return false;
        if (onlySolved && !topic.isSolved) return false;
        if (normalizedQuery && !matchesQuery(topic, normalizedQuery))
            return false;
        return true;
    });

    return sortTopics(filtered, sort);
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const formatRelativeDate = (date: string): string => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHours < 24)
        return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30)
        return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    const diffMonths = Math.floor(diffDays / 30);
    return `há ${diffMonths} ${diffMonths > 1 ? 'meses' : 'mês'}`;
};

export const getCategoryColor = (category: ForumCategory): string => {
    const colors: Record<ForumCategory, string> = {
        Geral: 'bg-blue-500/20 text-blue-400',
        Recomendações: 'bg-green-500/20 text-green-400',
        Spoilers: 'bg-red-500/20 text-red-400',
        Suporte: 'bg-yellow-500/20 text-yellow-400',
        'Off-topic': 'bg-gray-500/20 text-gray-400',
        Teorias: 'bg-purple-500/20 text-purple-400',
        Fanart: 'bg-pink-500/20 text-pink-400',
        Notícias: 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[category];
};

export const paginateTopics = (
    topics: ForumTopic[],
    page: number,
): { items: ForumTopic[]; totalPages: number } => {
    const totalPages = Math.max(1, Math.ceil(topics.length / TOPICS_PER_PAGE));
    const start = (page - 1) * TOPICS_PER_PAGE;
    return {
        items: topics.slice(start, start + TOPICS_PER_PAGE),
        totalPages,
    };
};

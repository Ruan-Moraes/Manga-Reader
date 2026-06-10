import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { ForumCategory, ForumFilter, ForumSort, ForumTopic } from '../model/forum.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const forumCategories: ForumCategory[] = ['Geral', 'Recomendações', 'Spoilers', 'Suporte', 'Off-topic', 'Teorias', 'Fanart', 'Notícias'];

export const forumSortOptions: { value: ForumSort; label: string }[] = [
    { value: 'recent', label: 'Mais recentes' },
    { value: 'popular', label: 'Mais populares' },
    { value: 'most-replies', label: 'Mais respostas' },
    { value: 'oldest', label: 'Mais antigos' },
];

export const TOPICS_PER_PAGE = 8;

// ---------------------------------------------------------------------------
// Helpers (sync — usados em useMemo)
// ---------------------------------------------------------------------------

const matchesQuery = (topic: ForumTopic, query: string): boolean => {
    const haystack = `${topic.title} ${topic.content} ${topic.tags.join(' ')} ${topic.author.name}`.toLowerCase();
    return haystack.includes(query);
};

const sortTopics = (topics: ForumTopic[], sort: ForumSort): ForumTopic[] => {
    const pinned = topics.filter(t => t.isPinned);
    const unpinned = topics.filter(t => !t.isPinned);

    const sorted = [...unpinned].sort((a, b) => {
        switch (sort) {
            case 'popular':
                return b.upvotes - a.upvotes;
            case 'most-replies':
                return b.replyCount - a.replyCount;
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'recent':
            default:
                return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        }
    });

    return [...pinned, ...sorted];
};

// ---------------------------------------------------------------------------
// Public API — Async (chamadas ao api)
// ---------------------------------------------------------------------------

export const getForumTopics = async (page = 0, size = 20, options: { crossLanguage?: boolean } = {}): Promise<PageResponse<ForumTopic>> => {
    const params: Record<string, string | number> = { page, size };
    if (options.crossLanguage) params.language = 'all';
    const response = await api.get<ApiResponse<PageResponse<ForumTopic>>>(API_URLS.FORUM, { params });

    return response.data.data;
};

export const getForumTopicById = async (id: string): Promise<ForumTopic> => {
    const response = await api.get<ApiResponse<ForumTopic>>(`${API_URLS.FORUM}/${id}`);

    return response.data.data;
};

export const getForumCategories = async (): Promise<ForumCategory[]> => {
    const response = await api.get<ApiResponse<ForumCategory[]>>(`${API_URLS.FORUM}/categories`);

    return response.data.data;
};

type VoteResponse = {
    upvotes: number;
    downvotes: number;
    myVote?: 'up' | 'down' | null;
};

/** Voto padronizado no tópico (toggle no backend). */
export const voteForumTopic = async (id: string, value: 'up' | 'down'): Promise<VoteResponse> => {
    const response = await api.post<ApiResponse<VoteResponse>>(`${API_URLS.FORUM}/${id}/vote`, { value });

    return response.data.data;
};

export const removeForumTopicVote = async (id: string): Promise<VoteResponse> => {
    const response = await api.delete<ApiResponse<VoteResponse>>(`${API_URLS.FORUM}/${id}/vote`);

    return response.data.data;
};

// ---------------------------------------------------------------------------
// Sync filter — usado pelos componentes de rota em useMemo
// ---------------------------------------------------------------------------

export const filterForumTopics = (items: ForumTopic[], filters: ForumFilter): ForumTopic[] => {
    const { category = 'all', sort = 'recent', query = '', onlyPinned = false, onlySolved = false } = filters;

    const normalizedQuery = query.trim().toLowerCase();

    const filtered = items.filter(topic => {
        if (category !== 'all' && topic.category !== category) return false;
        if (onlyPinned && !topic.isPinned) return false;
        if (onlySolved && !topic.isSolved) return false;
        if (normalizedQuery && !matchesQuery(topic, normalizedQuery)) return false;
        return true;
    });

    return sortTopics(filtered, sort);
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// Re-exported from the shared single source (dedup, DT-25.3).
export { default as formatRelativeDate } from '@shared/service/util/formatRelativeDate';

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

export const paginateTopics = (topics: ForumTopic[], page: number): { items: ForumTopic[]; totalPages: number } => {
    const totalPages = Math.max(1, Math.ceil(topics.length / TOPICS_PER_PAGE));
    const start = (page - 1) * TOPICS_PER_PAGE;
    return {
        items: topics.slice(start, start + TOPICS_PER_PAGE),
        totalPages,
    };
};

export const roleLabelKey: Record<string, string> = {
    admin: 'role.admin',
    moderator: 'role.moderator',
    member: 'role.member',
};

export const roleBadgeColor: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    moderator: 'bg-blue-500/20 text-blue-400',
    member: 'bg-gray-500/20 text-gray-400',
};

import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type CommentData } from '../model/comment.types';

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do api (modelo de comentário unificado + voto único)
// ---------------------------------------------------------------------------

type CommentResponse = {
    id: string;
    targetType: string;
    targetId: string;
    parentCommentId: string | null;
    userId: string;
    userName: string;
    userPhoto: string;
    isHighlighted: boolean;
    edited: boolean;
    createdAt: string;
    updatedAt: string;
    textContent: string | null;
    imageContent: string | null;
    upvotes: number;
    downvotes: number;
    language?: string;
};

type VoteResponse = {
    upvotes: number;
    downvotes: number;
    myVote?: 'up' | 'down' | null;
};

// ---------------------------------------------------------------------------
// Mapper — api → frontend shape
//
// O backend padronizou os votos (upvotes/downvotes/myVote). O modelo interno do
// frontend mantém likeCount/dislikeCount (string) e userReaction (LIKE/DISLIKE)
// — a tradução acontece aqui, na borda, para não propagar a mudança de contrato.
// ---------------------------------------------------------------------------

const toCommentData = (c: CommentResponse): CommentData => ({
    id: c.id,
    parentCommentId: c.parentCommentId,
    user: {
        id: c.userId,
        name: c.userName,
        photo: c.userPhoto ?? '',
    },
    isOwner: false, // determinado pelo componente via auth context
    isHighlighted: c.isHighlighted,
    edited: c.edited,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    textContent: c.textContent,
    imageContent: c.imageContent,
    likeCount: String(c.upvotes),
    dislikeCount: String(c.downvotes),
    language: c.language,
    // userReaction não vem da listagem — é preenchido posteriormente por getUserReactions()
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getCommentsByTarget = async (
    targetType: string,
    targetId: string,
    page = 0,
    size = 20,
    options: { crossLanguage?: boolean } = {},
): Promise<PageResponse<CommentData>> => {
    const params: Record<string, string | number> = { page, size };
    if (options.crossLanguage) params.language = 'all';
    const segment = targetType.toLowerCase();
    const response = await api.get<ApiResponse<PageResponse<CommentResponse>>>(`${API_URLS.COMMENTS}/${segment}/${targetId}`, { params });

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toCommentData),
    };
};

/** @deprecated Use getCommentsByTarget('TITLE', titleId) */
export const getCommentsByTitleId = (
    titleId: string,
    page = 0,
    size = 20,
    options: { crossLanguage?: boolean } = {},
): Promise<PageResponse<CommentData>> => getCommentsByTarget('TITLE', titleId, page, size, options);

export const createComment = async (data: { targetType: string; targetId: string; textContent: string; parentCommentId?: string | null }): Promise<CommentData> => {
    const response = await api.post<ApiResponse<CommentResponse>>(API_URLS.COMMENTS, {
        targetType: data.targetType,
        targetId: data.targetId,
        textContent: data.textContent,
        parentCommentId: data.parentCommentId ?? null,
    });

    return toCommentData(response.data.data);
};

export const updateComment = async (id: string, textContent: string): Promise<CommentData> => {
    const response = await api.put<ApiResponse<CommentResponse>>(`${API_URLS.COMMENTS}/${id}`, { textContent });

    return toCommentData(response.data.data);
};

export const deleteComment = async (id: string): Promise<void> => {
    await api.delete(`${API_URLS.COMMENTS}/${id}`);
};

// Modelo de voto único: um endpoint /vote (toggle). likeComment/dislikeComment
// são atalhos para value 'up'/'down', preservando a API consumida pelos hooks.
const castVote = async (id: string, value: 'up' | 'down'): Promise<VoteResponse> => {
    const response = await api.post<ApiResponse<VoteResponse>>(`${API_URLS.COMMENTS}/${id}/vote`, { value });

    return response.data.data;
};

export const likeComment = (id: string): Promise<VoteResponse> => castVote(id, 'up');

export const dislikeComment = (id: string): Promise<VoteResponse> => castVote(id, 'down');

export const removeCommentVote = async (id: string): Promise<VoteResponse> => {
    const response = await api.delete<ApiResponse<VoteResponse>>(`${API_URLS.COMMENTS}/${id}/vote`);

    return response.data.data;
};

/** Votos do usuário em lote, no contrato padronizado (up/down). */
export const getUserCommentVotes = async (commentIds: string[]): Promise<Record<string, 'up' | 'down'>> => {
    const response = await api.get<ApiResponse<Record<string, 'up' | 'down'>>>(`${API_URLS.COMMENTS}/user-votes`, {
        params: { commentIds: commentIds.join(',') },
    });

    return response.data.data;
};

export const getUserReactions = async (commentIds: string[]): Promise<Record<string, string>> => {
    const votes = await getUserCommentVotes(commentIds);

    // Traduz o voto padronizado (up/down) para o modelo interno (LIKE/DISLIKE).
    const out: Record<string, string> = {};
    for (const [id, vote] of Object.entries(votes)) {
        out[id] = vote === 'up' ? 'LIKE' : 'DISLIKE';
    }

    return out;
};

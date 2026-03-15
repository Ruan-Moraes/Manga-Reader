import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type CommentData } from '../type/comment.types';

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do backend
// ---------------------------------------------------------------------------

type CommentResponse = {
    id: string;
    titleId: string;
    parentCommentId: string | null;
    userId: string;
    userName: string;
    userPhoto: string;
    isHighlighted: boolean;
    wasEdited: boolean;
    createdAt: string;
    textContent: string | null;
    imageContent: string | null;
    likeCount: string;
    dislikeCount: string;
};

// ---------------------------------------------------------------------------
// Mapper — backend → frontend shape
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
    wasEdited: c.wasEdited,
    createdAt: c.createdAt,
    textContent: c.textContent,
    imageContent: c.imageContent,
    likeCount: c.likeCount,
    dislikeCount: c.dislikeCount,
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getCommentsByTitleId = async (
    titleId: string,
    page = 0,
    size = 20,
): Promise<PageResponse<CommentData>> => {
    const response = await api.get<ApiResponse<PageResponse<CommentResponse>>>(
        `${API_URLS.COMMENTS}/title/${titleId}`,
        { params: { page, size } },
    );

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toCommentData),
    };
};

export const createComment = async (data: {
    titleId: string;
    textContent: string;
    parentCommentId?: string | null;
}): Promise<CommentData> => {
    const response = await api.post<ApiResponse<CommentResponse>>(
        API_URLS.COMMENTS,
        {
            titleId: data.titleId,
            textContent: data.textContent,
            parentCommentId: data.parentCommentId ?? null,
        },
    );

    return toCommentData(response.data.data);
};

export const updateComment = async (
    id: string,
    textContent: string,
): Promise<CommentData> => {
    const response = await api.put<ApiResponse<CommentResponse>>(
        `${API_URLS.COMMENTS}/${id}`,
        { textContent },
    );

    return toCommentData(response.data.data);
};

export const deleteComment = async (id: string): Promise<void> => {
    await api.delete(`${API_URLS.COMMENTS}/${id}`);
};

export const likeComment = async (id: string): Promise<CommentData> => {
    const response = await api.post<ApiResponse<CommentResponse>>(
        `${API_URLS.COMMENTS}/${id}/like`,
    );

    return toCommentData(response.data.data);
};

export const dislikeComment = async (id: string): Promise<CommentData> => {
    const response = await api.post<ApiResponse<CommentResponse>>(
        `${API_URLS.COMMENTS}/${id}/dislike`,
    );

    return toCommentData(response.data.data);
};

export const getUserReactions = async (
    commentIds: string[],
): Promise<Record<string, string>> => {
    const response = await api.get<ApiResponse<Record<string, string>>>(
        `${API_URLS.COMMENTS}/user-reactions`,
        { params: { commentIds: commentIds.join(',') } },
    );

    return response.data.data;
};

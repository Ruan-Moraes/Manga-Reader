import { simulateDelay } from '@shared/service/mockApi';
import { mockComments } from '@mock/data/comments';
import { mockUsers } from '@mock/data/users';

import { type CommentData } from '../type/comment.types';

// ---------------------------------------------------------------------------
// Comment Service
// ---------------------------------------------------------------------------

/** Armazena comentários em memória para permitir CRUD sem recarregar. */
const commentsStore: Record<string, CommentData[]> = { ...mockComments };

export const getCommentsByTitleId = async (
    titleId: number | string,
): Promise<CommentData[]> => {
    await simulateDelay();

    return commentsStore[String(titleId)] ?? [];
};

export const createComment = async (data: {
    titleId: string;
    textContent: string;
    parentCommentId?: string | null;
}): Promise<CommentData> => {
    await simulateDelay();

    const currentUser = mockUsers[0]; // usuário logado

    const newComment: CommentData = {
        id: `c-${data.titleId}-${Date.now()}`,
        parentCommentId: data.parentCommentId ?? null,
        user: currentUser,
        isOwner: true,
        isHighlighted: false,
        wasEdited: false,
        createdAt: new Date().toISOString(),
        textContent: data.textContent,
        imageContent: null,
        dislikeCount: '0',
        likeCount: '0',
    };

    if (!commentsStore[data.titleId]) {
        commentsStore[data.titleId] = [];
    }

    commentsStore[data.titleId] = [newComment, ...commentsStore[data.titleId]];

    return newComment;
};

export const updateComment = async (
    id: string,
    textContent: string,
): Promise<void> => {
    await simulateDelay();

    for (const titleId of Object.keys(commentsStore)) {
        commentsStore[titleId] = commentsStore[titleId].map(c =>
            c.id === id ? { ...c, textContent, wasEdited: true } : c,
        );
    }
};

export const deleteComment = async (id: string): Promise<void> => {
    await simulateDelay();

    for (const titleId of Object.keys(commentsStore)) {
        commentsStore[titleId] = commentsStore[titleId].filter(
            c => c.id !== id,
        );
    }
};

export const likeComment = async (id: string): Promise<void> => {
    await simulateDelay();

    for (const titleId of Object.keys(commentsStore)) {
        commentsStore[titleId] = commentsStore[titleId].map(c =>
            c.id === id
                ? { ...c, likeCount: String(Number(c.likeCount) + 1) }
                : c,
        );
    }
};

export const dislikeComment = async (id: string): Promise<void> => {
    await simulateDelay();

    for (const titleId of Object.keys(commentsStore)) {
        commentsStore[titleId] = commentsStore[titleId].map(c =>
            c.id === id
                ? { ...c, dislikeCount: String(Number(c.dislikeCount) + 1) }
                : c,
        );
    }
};

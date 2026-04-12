import type {
    CommentData,
    CommentWithChildren,
} from '@feature/comment/type/comment.types';

import { buildUser } from './userFactory';

let commentCounter = 0;

export const buildCommentData = (
    overrides: Partial<CommentData> = {},
): CommentData => {
    commentCounter += 1;

    return {
        id: `comment-${commentCounter}`,
        parentCommentId: null,
        user: buildUser(),
        isOwner: false,
        isHighlighted: false,
        wasEdited: false,
        createdAt: '2026-03-15T10:00:00Z',
        textContent: `Texto do comentario ${commentCounter}.`,
        imageContent: null,
        likeCount: '0',
        dislikeCount: '0',
        userReaction: null,
        ...overrides,
    };
};

export const commentDataPresets = {
    root: () => buildCommentData({ parentCommentId: null }),
    reply: () => buildCommentData({ parentCommentId: 'comment-parent' }),

    owner: () => buildCommentData({ isOwner: true }),
    highlighted: () => buildCommentData({ isHighlighted: true }),
    edited: () =>
        buildCommentData({ wasEdited: true, textContent: 'Editado.' }),

    withImage: () =>
        buildCommentData({
            imageContent: 'https://example.com/comment-image.jpg',
        }),
    onlyImage: () =>
        buildCommentData({
            textContent: null,
            imageContent: 'https://example.com/only-image.jpg',
        }),
    onlyText: () =>
        buildCommentData({ textContent: 'Apenas texto.', imageContent: null }),

    liked: () => buildCommentData({ likeCount: '42', userReaction: 'LIKE' }),
    disliked: () =>
        buildCommentData({ dislikeCount: '7', userReaction: 'DISLIKE' }),
    noReaction: () =>
        buildCommentData({
            likeCount: '0',
            dislikeCount: '0',
            userReaction: null,
        }),
    veryPopular: () =>
        buildCommentData({ likeCount: '9999', dislikeCount: '12' }),

    longText: () =>
        buildCommentData({
            textContent:
                'Comentario muito longo para testar truncamento e overflow. '.repeat(
                    20,
                ),
        }),
};

export const buildCommentWithChildren = (
    overrides: Partial<CommentWithChildren> = {},
): CommentWithChildren => ({
    ...buildCommentData(),
    children: [],
    ...overrides,
});

/**
 * Cria uma arvore de comentarios com profundidade arbitraria.
 * Cada nivel tem `breadth` filhos. Util para testar renderizacao recursiva.
 */
export const buildCommentTree = (
    depth = 2,
    breadth = 2,
): CommentWithChildren => {
    const root = buildCommentWithChildren();
    if (depth === 0) {
        return root;
    }

    root.children = Array.from({ length: breadth }, () =>
        buildCommentTree(depth - 1, breadth),
    );

    return root;
};

export const commentTreePresets = {
    leaf: () => buildCommentWithChildren({ children: [] }),
    singleChild: () =>
        buildCommentWithChildren({
            children: [buildCommentWithChildren()],
        }),
    threeLevels: () => buildCommentTree(3, 2),
    wideThread: () => buildCommentTree(1, 5),
    deepThread: () => buildCommentTree(5, 1),
};

export const buildCommentList = (count = 10): CommentData[] =>
    Array.from({ length: count }, () => buildCommentData());

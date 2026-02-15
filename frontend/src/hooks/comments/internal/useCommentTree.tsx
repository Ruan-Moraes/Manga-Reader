import { useCallback } from 'react';

import {
    CommentTypes,
    CommentWithChildrenTypes,
} from '../../../types/CommentTypes';

import { useCommentSortContext } from '../../../context/comments/CommentSortContext';

const useCommentTree = (comments: CommentTypes[] | Error) => {
    const isError = comments instanceof Error;

    const { sortType } = useCommentSortContext();

    const createCommentMap = useCallback(
        (comments: CommentTypes[]) => {
            if (isError || !comments || comments.length === 0) {
                return new Map<string, CommentWithChildrenTypes>();
            }

            const map = new Map<string, CommentWithChildrenTypes>();

            comments.forEach(comment => {
                map.set(comment.id, { ...comment, children: [] });
            });

            return map;
        },
        [isError],
    );

    const buildTree = useCallback(
        (
            map: Map<string, CommentWithChildrenTypes>,
            comments: CommentTypes[],
        ) => {
            if (isError || !comments || comments.length === 0) {
                return [];
            }

            const roots: CommentWithChildrenTypes[] = [];

            comments.forEach(comment => {
                const mappedComment = map.get(comment.id)!;

                if (comment.parentCommentId) {
                    const parent = map.get(comment.parentCommentId);

                    parent?.children.push(mappedComment);
                }

                if (!comment.parentCommentId) {
                    roots.push(mappedComment);
                }
            });

            return roots;
        },
        [isError],
    );

    const flattenTree = useCallback(
        (
            comments: CommentWithChildrenTypes[],
            level = 0,
        ): { comment: CommentTypes; nestedLevel: number }[] => {
            if (isError || !comments || comments.length === 0) {
                return [];
            }

            return comments.flatMap(comment => [
                {
                    comment: { ...comment, children: null },
                    nestedLevel: level,
                },

                ...flattenTree(comment.children, level + 1),
            ]);
        },
        [isError],
    );

    const sortCommentsByType = useCallback(
        (a: CommentWithChildrenTypes, b: CommentWithChildrenTypes) => {
            if (a.isHighlighted && !b.isHighlighted) {
                return -1;
            }

            if (!a.isHighlighted && b.isHighlighted) {
                return 1;
            }

            if (!sortType) return 0;

            switch (sortType) {
                case 'likes':
                    return parseInt(b.likeCount) - parseInt(a.likeCount);
                case 'dislikes':
                    return parseInt(b.dislikeCount) - parseInt(a.dislikeCount);
                case 'newest':
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                case 'oldest':
                    return (
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    );
                default:
                    return 0;
            }
        },
        [sortType],
    );

    const sortTreeRecursively = useCallback(
        (comments: CommentWithChildrenTypes[]): CommentWithChildrenTypes[] => {
            const sortedComments = [...comments].sort(sortCommentsByType);

            return sortedComments.map(comment => ({
                ...comment,
                children: sortTreeRecursively(comment.children),
            }));
        },
        [sortCommentsByType],
    );

    const ensureHighlightedAtTop = useCallback(
        (comments: CommentWithChildrenTypes[]): CommentWithChildrenTypes[] => {
            const sortedComments = [...comments].sort((a, b) => {
                if (a.isHighlighted && !b.isHighlighted) {
                    return -1;
                }

                if (!a.isHighlighted && b.isHighlighted) {
                    return 1;
                }

                return 0;
            });

            return sortedComments.map(comment => ({
                ...comment,
                children: ensureHighlightedAtTop(comment.children),
            }));
        },
        [],
    );

    const getCommentsTree = useCallback(() => {
        if (isError || !comments || comments.length === 0) {
            return [];
        }

        const commentMap = createCommentMap(comments);
        const commentsTree = buildTree(commentMap, comments);

        const treeToFlatten = sortType
            ? sortTreeRecursively(commentsTree)
            : ensureHighlightedAtTop(commentsTree);

        return flattenTree(treeToFlatten);
    }, [
        isError,
        comments,
        createCommentMap,
        buildTree,
        sortType,
        sortTreeRecursively,
        ensureHighlightedAtTop,
        flattenTree,
    ]);

    return { getCommentsTree };
};

export default useCommentTree;

import { useCallback } from 'react';
import {
    CommentTypes,
    CommentWithChildrenTypes,
} from '../../../types/CommentTypes';

const useCommentTree = (comments: CommentTypes[] | Error) => {
    const isError = comments instanceof Error;

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

    const getCommentsTree = useCallback(() => {
        if (isError || !comments || comments.length === 0) {
            return [];
        }

        const commentMap = createCommentMap(comments);
        const commentsTree = buildTree(commentMap, comments);

        return flattenTree(commentsTree);
    }, [isError, comments, createCommentMap, buildTree, flattenTree]);

    return { getCommentsTree };
};

export default useCommentTree;

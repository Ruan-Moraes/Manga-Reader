import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { requireAuth } from '@shared/service/util/requireAuth';
import { getStoredSession } from '@feature/auth/service/authService';

import {
    getUserReactions,
    likeComment,
    dislikeComment,
} from '../../service/commentService';

const useCommentReactions = (commentIds: string[]) => {
    const queryClient = useQueryClient();
    const isAuthenticated = !!getStoredSession();

    const stableKey = useMemo(
        () => [...commentIds].sort().join(','),
        [commentIds],
    );

    const { data: serverReactions } = useQuery({
        queryKey: [QUERY_KEYS.COMMENTS, 'reactions', stableKey],
        queryFn: () => getUserReactions(commentIds),
        enabled: isAuthenticated && commentIds.length > 0,
        staleTime: 30_000,
    });

    const [optimistic, setOptimistic] = useState<Record<string, string | null>>(
        {},
    );

    const reactionsMap = useMemo(() => {
        const merged: Record<string, string | null> = {
            ...(serverReactions ?? {}),
        };
        for (const [key, val] of Object.entries(optimistic)) {
            if (val === null) {
                delete merged[key];
            } else {
                merged[key] = val;
            }
        }
        return merged;
    }, [serverReactions, optimistic]);

    const invalidate = useCallback(() => {
        setOptimistic({});
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.COMMENTS, 'reactions', stableKey],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.COMMENTS],
            exact: false,
        });
    }, [queryClient, stableKey]);

    const toggleLike = useCallback(
        async (commentId: string) => {
            if (!requireAuth('curtir')) return;

            const current = reactionsMap[commentId] ?? null;

            if (current === 'LIKE') {
                setOptimistic(prev => ({ ...prev, [commentId]: null }));
            } else {
                setOptimistic(prev => ({ ...prev, [commentId]: 'LIKE' }));
            }

            try {
                await likeComment(commentId);
            } finally {
                invalidate();
            }
        },
        [isAuthenticated, reactionsMap, invalidate],
    );

    const toggleDislike = useCallback(
        async (commentId: string) => {
            if (!requireAuth('descurtir')) return;

            const current = reactionsMap[commentId] ?? null;

            if (current === 'DISLIKE') {
                setOptimistic(prev => ({ ...prev, [commentId]: null }));
            } else {
                setOptimistic(prev => ({ ...prev, [commentId]: 'DISLIKE' }));
            }

            try {
                await dislikeComment(commentId);
            } finally {
                invalidate();
            }
        },
        [isAuthenticated, reactionsMap, invalidate],
    );

    return { reactionsMap, toggleLike, toggleDislike };
};

export default useCommentReactions;

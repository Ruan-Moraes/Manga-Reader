import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getFollowers, getFollowing } from '../api/followService';

export type FollowListKind = 'followers' | 'following';

/**
 * Lista de seguidores/seguindo de um usuário (DT-48). `enabled` controla o
 * fetch — o modal só busca quando aberto.
 */
export default function useFollowList(userId: string | undefined, kind: FollowListKind, enabled: boolean, page = 0) {
    const query = useQuery({
        queryKey: [kind === 'followers' ? QUERY_KEYS.FOLLOWERS : QUERY_KEYS.FOLLOWING, userId, page],
        queryFn: () => (kind === 'followers' ? getFollowers(userId!, page) : getFollowing(userId!, page)),
        enabled: enabled && !!userId,
    });

    return {
        users: query.data?.content ?? [],
        totalElements: query.data?.totalElements ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
    };
}

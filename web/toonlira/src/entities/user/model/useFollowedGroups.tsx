import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getFollowedGroups } from '../api/followService';

/** Grupos que o usuário segue/apoia (SUPPORTER) — seção do perfil (DT-48). */
export default function useFollowedGroups(userId: string | undefined) {
    const query = useQuery({
        queryKey: [QUERY_KEYS.FOLLOWED_GROUPS, userId],
        queryFn: () => getFollowedGroups(userId!),
        enabled: !!userId,
    });

    return {
        groups: query.data ?? [],
        isLoading: query.isLoading,
    };
}

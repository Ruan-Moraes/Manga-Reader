import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getUserProfile } from '../service/userService';
import { type User } from '../type/user.types';

const FIVE_MINUTES = 1000 * 60 * 5;

const useUserDetails = (userId: string | undefined) => {
    const { data, isLoading, isError } = useQuery<User, Error>({
        queryKey: [QUERY_KEYS.USER_PROFILE, userId],
        queryFn: () => getUserProfile(userId!),
        enabled: Boolean(userId),
        staleTime: FIVE_MINUTES,
    });

    return {
        user: data ?? null,
        isLoading: Boolean(userId) && isLoading,
        isError,
    };
};

export default useUserDetails;

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getUserReviews, getUserReviewsById } from '../api/reviewService';

/**
 * Resenhas de um usuário para a página de perfil.
 * - `userId` definido → resenhas públicas daquele usuário (`/api/ratings/user/{id}`);
 * - `userId` ausente → resenhas do usuário logado (`/api/ratings/user`).
 *
 * Substitui o mock de resenhas do perfil (DT — perfil real).
 */
const useUserReviews = (userId?: string) => {
    const query = useQuery({
        queryKey: [QUERY_KEYS.USER_REVIEWS, userId ?? 'me'],
        queryFn: () => (userId ? getUserReviewsById(userId) : getUserReviews()),
        staleTime: 1000 * 60,
    });

    return {
        reviews: query.data?.content ?? [],
        totalElements: query.data?.totalElements ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
    };
};

export default useUserReviews;

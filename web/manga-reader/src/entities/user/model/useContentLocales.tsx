import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { type ContentLocales, getMyContentLocales, updateMyContentLocales } from '../api/userService';

const useContentLocales = (isLoggedIn: boolean) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [QUERY_KEYS.USER_CONTENT_LOCALES],
        queryFn: getMyContentLocales,
        enabled: isLoggedIn,
        staleTime: 5 * 60 * 1000,
    });

    const mutation = useMutation({
        mutationFn: (payload: ContentLocales) => updateMyContentLocales(payload),
        onSuccess: data => {
            queryClient.setQueryData([QUERY_KEYS.USER_CONTENT_LOCALES], data);
            // Recarrega a página: força refetch de todas as rotas de conteúdo
            // com o novo Accept-Language e limpa caches client-side.
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        },
    });

    return { query, mutation };
};

export default useContentLocales;

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getMySettings, updateMySettings } from '../api/userService';
import { type UserSettings } from './userSettings.types';

/**
 * Lê e sincroniza as configurações do sistema com o api. Só ativa para usuários logados — o
 * estado offline/deslogado é resolvido no store da página (localStorage). Espelha useContentLocales.
 */
const useUserSettings = (isLoggedIn: boolean, userId?: string) => {
    const queryClient = useQueryClient();
    const queryKey = [QUERY_KEYS.USER_SETTINGS, userId ?? 'guest'] as const;

    const query = useQuery({
        queryKey,
        queryFn: getMySettings,
        enabled: isLoggedIn,
        staleTime: 5 * 60 * 1000,
    });

    const mutation = useMutation({
        mutationFn: (payload: UserSettings) => updateMySettings(payload),
        onSuccess: data => {
            queryClient.setQueryData(queryKey, data);
        },
    });

    return { query, mutation };
};

export default useUserSettings;

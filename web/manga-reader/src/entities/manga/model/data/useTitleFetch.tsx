import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { Title } from '@entities/manga';

import { getTitleById } from '../../api/titleService';

const useTitleFetch = (id: string): UseQueryResult<Title, Error> => {
    return useQuery<Title, Error>({
        queryKey: [QUERY_KEYS.TITLES, id],
        // IDs de título são strings do MongoDB (ObjectId), não numéricos — validar
        // por presença, não por Number(). `enabled` evita disparo com id vazio,
        // garantindo que o reload (id vindo da URL) carregue a obra.
        enabled: Boolean(id),
        queryFn: async () => {
            if (!id) {
                throw new Error(ERROR_MESSAGES.INVALID_ID_ERROR);
            }

            try {
                return await getTitleById(id);
            } catch {
                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },
    });
};

export default useTitleFetch;

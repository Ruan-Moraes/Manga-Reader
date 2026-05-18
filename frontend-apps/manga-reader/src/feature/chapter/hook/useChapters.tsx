import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getChaptersByTitleId } from '../service/chapterService';
import { type Chapter } from '../type/chapter.types';

/**
 * Capítulos de um título (DT-17 — coleção própria, endpoint paginado).
 * Busca uma página ampla e expõe `chapters` para a UI atual de listagem;
 * paginação real de UI é evolução futura.
 */
const useChapters = (titleId: string, page = 0, size = 500) => {
    const query = useQuery<Chapter[], Error>({
        queryKey: [QUERY_KEYS.CHAPTERS, titleId, page, size],
        queryFn: async () => {
            const res = await getChaptersByTitleId(titleId, page, size);

            return res.content;
        },
        enabled: Boolean(titleId),
        staleTime: 1000 * 60 * 5,
    });

    return {
        chapters: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    };
};

export default useChapters;

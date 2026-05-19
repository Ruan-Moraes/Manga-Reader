import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';

import { getChaptersByTitleId } from '../service/chapterService';
import { type Chapter } from '../type/chapter.types';

type UseChaptersOptions = {
    page?: number;
    size?: number;
    direction?: 'asc' | 'desc';
};

/**
 * Capítulos de um título (DT-17 — coleção própria) com paginação real no
 * servidor (DT-19). A página/ordenação são controladas pelo chamador; a
 * ordenação numérica é resolvida no backend (global, correta entre páginas).
 */
const useChapters = (
    titleId: string,
    { page = 0, size = 20, direction = 'asc' }: UseChaptersOptions = {},
) => {
    const query = useQuery<PageResponse<Chapter>, Error>({
        queryKey: [QUERY_KEYS.CHAPTERS, titleId, page, size, direction],
        queryFn: () => getChaptersByTitleId(titleId, page, size, direction),
        enabled: Boolean(titleId),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
    });

    return {
        chapters: query.data?.content ?? [],
        page: query.data?.page ?? page,
        totalPages: query.data?.totalPages ?? 0,
        totalElements: query.data?.totalElements ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
    };
};

export default useChapters;

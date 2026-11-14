import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getChapterByNumber } from '../api/chapterService';
import { type Chapter } from '../model/chapter.types';

/**
 * Capítulo único de um título, resolvido pelo número da URL. Expõe o `id`
 * interno (ObjectId) do capítulo, necessário como `targetId` dos comentários
 * do leitor.
 */
const useChapter = (titleId: string | undefined, chapterNumber: string | undefined) => {
    const query = useQuery<Chapter, Error>({
        queryKey: [QUERY_KEYS.CHAPTERS, titleId, 'by-number', chapterNumber],
        queryFn: () => getChapterByNumber(titleId as string, chapterNumber as string),
        enabled: Boolean(titleId) && Boolean(chapterNumber),
        staleTime: 1000 * 60 * 5,
    });

    return {
        chapter: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
    };
};

export default useChapter;

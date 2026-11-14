import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { chapterPublicGateway, type ReaderChapter } from '@entities/chapter';

type UseReaderPagesResult = {
    /** Capítulo com páginas reais, quando existe no armazenamento provisório. */
    readerChapter: ReaderChapter | null;
    /** A API não expôs o capítulo (ausente, adulto oculto ou não publicado). */
    isBlocked: boolean;
    isLoading: boolean;
};

/**
 * Páginas públicas do capítulo via ChapterPublicGateway.
 *
 * Respostas não encontradas são exibidas como indisponíveis; nenhum conteúdo
 * sintético é criado no cliente.
 * `preview` permite ao admin/poster visualizar capítulos não publicados.
 */
const useReaderPages = (titleId: string | undefined, chapterNumber: string | undefined, preview = false): UseReaderPagesResult => {
    const { data, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.READER_PAGES, titleId, chapterNumber, preview],
        queryFn: () => chapterPublicGateway.getReaderChapter(titleId!, chapterNumber!, { includeUnpublished: preview }),
        enabled: !!titleId && !!chapterNumber,
        staleTime: 60_000,
    });

    return {
        readerChapter: data && data !== 'blocked' ? data : null,
        isBlocked: data === 'blocked',
        isLoading,
    };
};

export default useReaderPages;

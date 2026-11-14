import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { chapterAdminGateway } from '@entities/chapter';

/** Enquanto houver página no pipeline, faz polling para refletir o progresso. */
const PIPELINE_POLL_MS = 1_500;

const useAdminChapterDetail = (chapterId: string | undefined) => {
    const chapterQuery = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTER_DETAIL, chapterId],
        queryFn: () => chapterAdminGateway.getById(chapterId!),
        enabled: !!chapterId,
    });

    const pagesQuery = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTER_PAGES, chapterId],
        queryFn: () => chapterAdminGateway.listPages(chapterId!),
        enabled: !!chapterId,
        refetchInterval: query => {
            const pages = query.state.data;
            const pending = pages?.some(p => p.processingStatus === 'uploading' || p.processingStatus === 'processing');
            return pending ? PIPELINE_POLL_MS : false;
        },
    });

    return {
        chapter: chapterQuery.data ?? null,
        pages: pagesQuery.data ?? [],
        isLoading: chapterQuery.isLoading || pagesQuery.isLoading,
        isError: chapterQuery.isError || pagesQuery.isError,
        refetch: () => {
            void chapterQuery.refetch();
            void pagesQuery.refetch();
        },
    };
};

export default useAdminChapterDetail;

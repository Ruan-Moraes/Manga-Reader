import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';

import { CommentData } from '../../model/comment.types';

import { getCommentsByTarget } from '../../api/commentService';

const useCommentsFetch = (
    id: string,
    page = 0,
    size = 20,
    options: { crossLanguage?: boolean; targetType?: string } = {},
): UseQueryResult<PageResponse<CommentData>, Error> => {
    const { crossLanguage = false, targetType = 'TITLE' } = options;
    return useQuery<PageResponse<CommentData>, Error>({
        queryKey: [QUERY_KEYS.COMMENTS, targetType, id, page, size, crossLanguage],
        enabled: !!id,
        queryFn: async () => {
            if (!id || id.trim() === '') throw new Error(ERROR_MESSAGES.INVALID_ID_ERROR);
            try {
                return await getCommentsByTarget(targetType, id, page, size, { crossLanguage });
            } catch (err) {
                if (import.meta.env.DEV) console.error('[useCommentsFetch]', err);
                throw new Error(ERROR_MESSAGES.FETCH_COMMENTS_ERROR);
            }
        },
        staleTime: 60_000,
    });
};

export default useCommentsFetch;

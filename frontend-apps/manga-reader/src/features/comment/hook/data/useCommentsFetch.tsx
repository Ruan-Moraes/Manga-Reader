import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';

import { CommentData } from '../../type/comment.types';

import validateId from '@shared/service/util/validateId';
import { getCommentsByTitleId } from '../../service/commentService';

const useCommentsFetch = (id: string, page = 0, size = 20, options: { crossLanguage?: boolean } = {}): UseQueryResult<PageResponse<CommentData>, Error> => {
    const { crossLanguage = false } = options;
    return useQuery<PageResponse<CommentData>, Error>({
        queryKey: [QUERY_KEYS.COMMENTS, id, page, size, crossLanguage],
        queryFn: async () => {
            try {
                validateId(Number(id));

                return await getCommentsByTitleId(id, page, size, {
                    crossLanguage,
                });
            } catch {
                throw new Error(ERROR_MESSAGES.FETCH_COMMENTS_ERROR);
            }
        },
        staleTime: 60_000,
    });
};

export default useCommentsFetch;

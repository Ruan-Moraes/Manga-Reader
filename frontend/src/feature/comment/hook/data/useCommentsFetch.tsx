import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';

import { CommentData } from '../../type/comment.types';

import validateId from '@shared/service/util/validateId';
import { getCommentsByTitleId } from '../../service/commentService';

const useCommentsFetch = (
    id: number,
    page = 0,
    size = 20,
): UseQueryResult<PageResponse<CommentData>, Error> => {
    return useQuery<PageResponse<CommentData>, Error>({
        queryKey: [QUERY_KEYS.COMMENTS, id, page, size],
        queryFn: async () => {
            try {
                validateId(id);

                return await getCommentsByTitleId(id, page, size);
            } catch (error) {
                console.error('Erro ao buscar comentários:', error);

                throw new Error(ERROR_MESSAGES.FETCH_COMMENTS_ERROR);
            }
        },
        staleTime: 0,
    });
};

export default useCommentsFetch;

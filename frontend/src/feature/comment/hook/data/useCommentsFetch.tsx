import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES, QUERY_KEYS } from '@shared/constant/API_CONSTANTS';

import { CommentData } from '../../type/comment.types';

import checkValidId from '@shared/service/util/checkValidId';
import { getCommentsByTitleId } from '../../service/commentService';

const useCommentsFetch = (
    id: number,
): UseQueryResult<CommentData[] | Error> => {
    return useQuery<CommentData[], Error>({
        queryKey: [QUERY_KEYS.COMMENTS, id],
        queryFn: async () => {
            try {
                checkValidId(id);

                return await getCommentsByTitleId(id);
            } catch (error) {
                console.error('Erro ao buscar comentários:', error);

                throw new Error(ERROR_MESSAGES.FETCH_COMMENTS_ERROR);
            }
        },
        staleTime: 0,
    });
};

export default useCommentsFetch;

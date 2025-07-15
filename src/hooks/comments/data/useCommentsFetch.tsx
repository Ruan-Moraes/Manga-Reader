import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES, QUERY_KEYS } from '../../../constants/API_CONSTANTS';

import { CommentTypes } from '../../../types/CommentTypes';

import checkValidReturn from '../../../services/utils/checkValidReturn';
import checkValidId from '../../../services/utils/checkValidId';

const useCommentsFetch = (
    url: string,
    id: number,
): UseQueryResult<CommentTypes[] | Error> => {
    return useQuery<CommentTypes[], Error>({
        queryKey: [QUERY_KEYS.COMMENTS, id],
        queryFn: async () => {
            try {
                checkValidId(id);

                const response = await fetch(
                    url + '/' + QUERY_KEYS.COMMENTS + '/' + id,
                );

                checkValidReturn(response);

                const comments: CommentTypes[] = await response.json();

                return comments;
            } catch (error) {
                console.error('Erro ao buscar comentários:', error);

                throw new Error(ERROR_MESSAGES.FETCH_COMMENTS_ERROR);
            }
        },
        staleTime: 0, // Não vou usar staleTime para comentários, pois eles podem mudar rapidamente
    });
};

export default useCommentsFetch;

import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { CommentTypes } from '../../types/CommentTypes';

const useFetchComments = (
  queryKey: string,
  url: string,
  validTime?: number
): UseQueryResult<CommentTypes[] | Error> => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Ocorreu um erro ao buscar os comentários');
      }

      const data: CommentTypes[] = await response.json();

      return data;
    },

    staleTime: validTime ? 1000 * 60 * 60 * 24 * validTime : 0,
  });
};

export default useFetchComments;

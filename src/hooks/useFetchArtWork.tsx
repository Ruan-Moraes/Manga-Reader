import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { TitleTypes } from '../types/TitleTypes';

const UseFetchArtWork = (
  queryKey: string,
  url: string,
  validTime?: number
): UseQueryResult<TitleTypes[] | Error> => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await fetch(url);

      return await response.json();
    },

    staleTime: validTime ? 1000 * 60 * validTime : 0,
  });
};

export default UseFetchArtWork;

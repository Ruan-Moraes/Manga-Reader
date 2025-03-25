import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { TitleTypes } from '../types/TitleTypes';

const UseFetchTitles = (
  url: string,
  validTime?: number
): UseQueryResult<Record<string, TitleTypes>, Error> => {
  return useQuery({
    queryKey: ['titles'],
    queryFn: async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      const data: TitleTypes[] = await response.json();

      const titles = data.reduce(
        (acc: Record<string, TitleTypes>, title: TitleTypes) => {
          acc[title.id] = title;

          return acc;
        },
        {}
      );

      return titles;
    },

    staleTime: validTime ? 1000 * 60 * validTime : 0,
  });
};

export default UseFetchTitles;

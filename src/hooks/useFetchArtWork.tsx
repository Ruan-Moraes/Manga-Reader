import { useQuery } from '@tanstack/react-query';

const UseFetchArtWork = <T,>(
  queryKey: string,
  url: string,
  validTime?: number
) => {
  return useQuery<T>({
    queryKey: [queryKey],
    queryFn: async () => {
      return await fetch(url).then((response) => response.json());
    },
    staleTime: validTime ? 1000 * 60 * validTime : 0,
  });
};

export default UseFetchArtWork;

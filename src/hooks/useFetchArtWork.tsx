import { useQuery } from '@tanstack/react-query';

interface IUseFetchArtWork<T> {
  data: T | Array<T> | null;
  status: 'pending' | 'error' | 'success';
  error: string | null;
}

const UseFetchArtWork = <T,>(
  queryKey: string,
  url: string,
  validTime?: number
) => {
  return useQuery<IUseFetchArtWork<T>>({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Ocorreu um erro ao buscar os dados');
      }

      return await response.json();
    },
    staleTime: validTime ? 1000 * 60 * validTime : 0,
  });
};

export default UseFetchArtWork;

import { useQuery, UseQueryResult } from '@tanstack/react-query';

export type TagsTypes = {
  id?: number;
  name: string;
};

const useTags = (): UseQueryResult<TagsTypes[], Error> => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/tags');

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      return data.map((tag: TagsTypes) => {
        return {
          label: tag.name,
          name: tag.name,
        };
      });
    },
  });
};

export default useTags;

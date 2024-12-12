import { TagsTypes } from '../types/TagsTypes';

export const tagsList: readonly TagsTypes[] = [
  { label: 'Nacionais', value: 'national' },
  { label: 'Mangás', value: 'mangas' },
  { label: 'Manhwas', value: 'manhwas' },
  { label: 'Manhuas', value: 'manhuas' },
  { label: 'Light Novels', value: 'novels' },
] as const;

export const tagsListOptions = tagsList.map((tag) => ({
  value: tag.value,
}));

console.log(tagsListOptions);

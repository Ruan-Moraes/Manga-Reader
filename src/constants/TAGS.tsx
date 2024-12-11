import { OptionTypes } from '../types/OptionTypes';

export const tagsList: readonly OptionTypes[] = [
  { label: 'Nacionais', value: 'national' },
  { label: 'Mangás', value: 'mangas' },
  { label: 'Manhwas', value: 'manhwas' },
  { label: 'Manhuas', value: 'manhuas' },
  { label: 'Light Novels', value: 'novels' },
] as const;

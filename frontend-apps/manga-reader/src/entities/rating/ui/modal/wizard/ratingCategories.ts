import type { IllustrationType } from '@ui/Illustration';

export const RATING_CATEGORIES = [
    { key: 'funRating', iconType: 'feliz' as IllustrationType },
    { key: 'artRating', iconType: 'pensando' as IllustrationType },
    { key: 'storylineRating', iconType: 'feliz' as IllustrationType },
    { key: 'charactersRating', iconType: 'feliz' as IllustrationType },
    { key: 'originalityRating', iconType: 'surpresa' as IllustrationType },
    { key: 'pacingRating', iconType: 'duvida' as IllustrationType },
] as const;

export type RatingCategory = (typeof RATING_CATEGORIES)[number];

export const RATING_CATEGORIES = [
    { key: 'funRating', icon: '🎉' },
    { key: 'artRating', icon: '🎨' },
    { key: 'storylineRating', icon: '📖' },
    { key: 'charactersRating', icon: '👤' },
    { key: 'originalityRating', icon: '💡' },
    { key: 'pacingRating', icon: '⏱' },
] as const;

export type RatingCategory = (typeof RATING_CATEGORIES)[number];

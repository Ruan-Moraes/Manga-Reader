import type { MangaRating } from './rating.types';

/**
 * Fonte única dos 6 critérios de avaliação. Reusado pelo formulário (RatingModal)
 * e pelo breakdown do ReviewCard. `labelKey`/`descKey` resolvem no namespace i18n `rating`.
 */
export const REVIEW_CRITERIA = [
    { key: 'funRating', labelKey: 'criteria.fun.name', descKey: 'criteria.fun.desc' },
    { key: 'artRating', labelKey: 'criteria.art.name', descKey: 'criteria.art.desc' },
    { key: 'storylineRating', labelKey: 'criteria.plot.name', descKey: 'criteria.plot.desc' },
    { key: 'charactersRating', labelKey: 'criteria.chars.name', descKey: 'criteria.chars.desc' },
    { key: 'originalityRating', labelKey: 'criteria.orig.name', descKey: 'criteria.orig.desc' },
    { key: 'pacingRating', labelKey: 'criteria.pace.name', descKey: 'criteria.pace.desc' },
] as const satisfies ReadonlyArray<{
    key: keyof Pick<MangaRating, 'funRating' | 'artRating' | 'storylineRating' | 'charactersRating' | 'originalityRating' | 'pacingRating'>;
    labelKey: string;
    descKey: string;
}>;

export type ReviewCriterionKey = (typeof REVIEW_CRITERIA)[number]['key'];

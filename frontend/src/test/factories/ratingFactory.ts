import type { MangaRating } from '@feature/rating/type/rating.types';

let ratingCounter = 0;

export const buildMangaRating = (
    overrides: Partial<MangaRating> = {},
): MangaRating => {
    ratingCounter += 1;

    return {
        id: `rating-${ratingCounter}`,
        titleId: `title-${ratingCounter}`,
        titleName: `Titulo ${ratingCounter}`,
        userName: `Usuario ${ratingCounter}`,
        overallRating: 4,
        funRating: 4,
        artRating: 4,
        storylineRating: 4,
        charactersRating: 4,
        originalityRating: 4,
        pacingRating: 4,
        comment: 'Comentario padrao do rating de teste.',
        createdAt: '2026-02-15T10:00:00Z',
        ...overrides,
    };
};

export const mangaRatingPresets = {
    perfect: () =>
        buildMangaRating({
            overallRating: 5,
            funRating: 5,
            artRating: 5,
            storylineRating: 5,
            charactersRating: 5,
            originalityRating: 5,
            pacingRating: 5,
        }),
    terrible: () =>
        buildMangaRating({
            overallRating: 0,
            funRating: 0,
            artRating: 0,
            storylineRating: 0,
            charactersRating: 0,
            originalityRating: 0,
            pacingRating: 0,
            comment: 'Nao gostei.',
        }),
    average: () =>
        buildMangaRating({
            overallRating: 2.5,
            funRating: 2.5,
            artRating: 2.5,
            storylineRating: 3,
            charactersRating: 2,
            originalityRating: 2,
            pacingRating: 3,
        }),
    withoutComment: () => buildMangaRating({ comment: undefined }),
    longComment: () =>
        buildMangaRating({
            comment:
                'Comentario muito longo descrevendo em detalhes a opiniao sobre a obra. '.repeat(
                    10,
                ),
        }),
    artistic: () =>
        buildMangaRating({
            artRating: 5,
            storylineRating: 2,
            overallRating: 3.5,
        }),
    storyDriven: () =>
        buildMangaRating({
            storylineRating: 5,
            charactersRating: 5,
            artRating: 2,
            overallRating: 4,
        }),
    noTitleName: () => buildMangaRating({ titleName: undefined }),
};

export const buildMangaRatingList = (count = 10): MangaRating[] =>
    Array.from({ length: count }, () => buildMangaRating());

import { type MangaRating } from '@feature/rating';

const users = [
    'Ana',
    'Carlos',
    'Mika',
    'Rui',
    'João',
    'Ester',
    'Nina',
    'Leo',
    'Sakura',
    'Dante',
];
const ratingComments = [
    'Arte impecável e história viciante.',
    'Ritmo bom, mas alguns capítulos são lentos.',
    'Gostei muito do desenvolvimento dos personagens.',
    'Leitura leve para maratonar no fim de semana.',
    'Final do último arco foi excelente.',
    'Tradução boa e capítulos bem consistentes.',
    'Recomendo para quem gosta do gênero.',
    'Cenários maravilhosos e painéis detalhados.',
];

const categoryKeys = [
    'Diversion',
    'Art',
    'Storyline',
    'Characters',
    'Originality',
    'Pacing',
] as const;

const buildCategoryRatings = (seed: number): Record<string, number> => {
    const ratings: Record<string, number> = {};
    categoryKeys.forEach((key, i) => {
        // Deterministic half-star values between 1.0 and 5.0
        const base = ((seed + i * 3) % 9) + 1; // 1-9
        ratings[key] = base * 0.5; // 0.5-4.5
        if (ratings[key] < 1) ratings[key] = 1;
        if (ratings[key] > 5) ratings[key] = 5;
    });
    return ratings;
};

/**
 * Gera avaliações determinísticas para os 16 títulos.
 * Usa uma seed simples (índice) para manter consistência entre reloads
 * enquanto localStorage não for inicializado.
 */
const buildRatings = (): Record<string, MangaRating[]> => {
    const ratings: Record<string, MangaRating[]> = {};

    for (let titleIndex = 0; titleIndex < 16; titleIndex++) {
        const titleId = String(titleIndex + 1);
        const amount = 3 + ((titleIndex * 7 + 3) % 8); // 3-10 ratings por título

        ratings[titleId] = Array.from({ length: amount }).map((_, i) => {
            const seed = titleIndex * 100 + i;
            const stars = 1 + (seed % 5);
            const catRatings = buildCategoryRatings(seed);

            return {
                id: `${titleId}-${i}`,
                titleId,
                userName: users[seed % users.length],
                stars,
                comment:
                    seed % 3 !== 0
                        ? ratingComments[seed % ratingComments.length]
                        : undefined,
                categoryRatings: catRatings,
                createdAt: new Date(
                    Date.now() - (seed + 1) * 86_400_000,
                ).toISOString(),
            };
        });
    }

    return ratings;
};

export const mockRatings = buildRatings();

/**
 * Avaliações do próprio usuário logado ("Você").
 */
export const mockUserReviews: MangaRating[] = [
    {
        id: 'review-1',
        titleId: '1',
        userName: 'Você',
        stars: 5,
        comment: 'Arte absurda e narrativa muito envolvente.',
        categoryRatings: {
            Diversion: 5,
            Art: 5,
            Storyline: 4.5,
            Characters: 5,
            Originality: 4.5,
            Pacing: 4,
        },
        createdAt: '2026-01-24T11:40:00.000Z',
    },
    {
        id: 'review-2',
        titleId: '2',
        userName: 'Você',
        stars: 4,
        comment: 'Excelente começo, quero ver os próximos arcos.',
        categoryRatings: {
            Diversion: 4,
            Art: 4.5,
            Storyline: 4,
            Characters: 3.5,
            Originality: 4,
            Pacing: 3.5,
        },
        createdAt: '2026-01-28T17:15:00.000Z',
    },
];

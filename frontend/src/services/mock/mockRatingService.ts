import { MangaRating } from '../../types/RatingTypes';

const STORAGE_KEY = 'manga-reader:ratings';

const users = ['Ana', 'Carlos', 'Mika', 'Rui', 'João', 'Ester', 'Nina', 'Leo'];
const comments = [
    'Arte impecável e história viciante.',
    'Ritmo bom, mas alguns capítulos são lentos.',
    'Gostei muito do desenvolvimento dos personagens.',
    'Leitura leve para maratonar no fim de semana.',
    'Final do último arco foi excelente.',
    'Tradução boa e capítulos bem consistentes.',
];

const randomFrom = <T>(items: T[]) =>
    items[Math.floor(Math.random() * items.length)] as T;

const generateMockRatings = () => {
    const ratings: Record<string, MangaRating[]> = {};

    Array.from({ length: 16 }).forEach((_, index) => {
        const titleId = String(index + 1);
        const amount = 3 + Math.floor(Math.random() * 8);

        ratings[titleId] = Array.from({ length: amount }).map(
            (__, ratingIndex) => {
                const stars = 1 + Math.floor(Math.random() * 5);

                return {
                    id: `${titleId}-${ratingIndex}`,
                    titleId,
                    userName: randomFrom(users),
                    stars,
                    comment:
                        Math.random() > 0.3 ? randomFrom(comments) : undefined,
                    createdAt: new Date(
                        Date.now() - Math.random() * 2.5e9,
                    ).toISOString(),
                };
            },
        );
    });

    return ratings;
};

const getRatingsStore = () => {
    const storage = localStorage.getItem(STORAGE_KEY);

    if (!storage) {
        const generated = generateMockRatings();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(generated));

        return generated;
    }

    return JSON.parse(storage) as Record<string, MangaRating[]>;
};

const saveRatingsStore = (ratings: Record<string, MangaRating[]>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
};

export const getTitleRatings = (titleId: string) => {
    const ratings = getRatingsStore();

    return ratings[titleId] ?? [];
};

export const getRatingsAverage = (titleId: string) => {
    const ratings = getTitleRatings(titleId);

    if (!ratings.length) {
        return 0;
    }

    const total = ratings.reduce((acc, rating) => acc + rating.stars, 0);

    return total / ratings.length;
};

export const submitTitleRating = ({
    titleId,
    stars,
    comment,
}: {
    titleId: string;
    stars: number;
    comment?: string;
}) => {
    const ratings = getRatingsStore();

    const newRating: MangaRating = {
        id: `${titleId}-${Date.now()}`,
        titleId,
        userName: 'Você',
        stars,
        comment,
        createdAt: new Date().toISOString(),
    };

    ratings[titleId] = [newRating, ...(ratings[titleId] ?? [])];

    saveRatingsStore(ratings);

    return newRating;
};

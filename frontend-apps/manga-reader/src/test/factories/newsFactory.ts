import type {
    NewsAuthor,
    NewsCategory,
    NewsComment,
    NewsItem,
    NewsReaction,
} from '@feature/news/type/news.types';

let newsCounter = 0;
let newsAuthorCounter = 0;
let newsCommentCounter = 0;

const ALL_NEWS_CATEGORIES: NewsCategory[] = [
    'Principais',
    'Lançamentos',
    'Adaptações',
    'Indústria',
    'Entrevistas',
    'Eventos',
    'Curiosidades',
    'Mercado',
    'Internacional',
];

export const buildNewsAuthor = (
    overrides: Partial<NewsAuthor> = {},
): NewsAuthor => {
    newsAuthorCounter += 1;

    return {
        id: `news-author-${newsAuthorCounter}`,
        name: `Autor ${newsAuthorCounter}`,
        avatar: `/avatars/author-${newsAuthorCounter}.png`,
        role: 'Editor',
        profileLink: `/users/author-${newsAuthorCounter}`,
        ...overrides,
    };
};

export const buildNewsReaction = (
    overrides: Partial<NewsReaction> = {},
): NewsReaction => ({
    like: 10,
    excited: 5,
    sad: 1,
    surprised: 3,
    ...overrides,
});

export const newsReactionPresets = {
    zero: (): NewsReaction =>
        buildNewsReaction({ like: 0, excited: 0, sad: 0, surprised: 0 }),
    viral: (): NewsReaction =>
        buildNewsReaction({
            like: 9999,
            excited: 5000,
            sad: 100,
            surprised: 2000,
        }),
    sadOnly: (): NewsReaction =>
        buildNewsReaction({ like: 0, excited: 0, sad: 500, surprised: 50 }),
};

export const buildNewsComment = (
    overrides: Partial<NewsComment> = {},
): NewsComment => {
    newsCommentCounter += 1;

    return {
        id: `news-comment-${newsCommentCounter}`,
        user: `Usuario ${newsCommentCounter}`,
        avatar: `/avatars/user-${newsCommentCounter}.png`,
        content: `Conteudo do comentario ${newsCommentCounter}.`,
        createdAt: '2026-03-15T10:00:00Z',
        likes: 5,
        spoiler: false,
        replies: [],
        ...overrides,
    };
};

export const newsCommentPresets = {
    plain: () => buildNewsComment({ spoiler: false, replies: [] }),
    spoiler: () =>
        buildNewsComment({
            spoiler: true,
            content: 'Atencao, contem spoiler!',
        }),
    withReplies: () =>
        buildNewsComment({
            replies: [
                {
                    id: 'reply-1',
                    user: 'Usuario A',
                    content: 'Concordo!',
                    createdAt: '2026-03-15T11:00:00Z',
                },
                {
                    id: 'reply-2',
                    user: 'Usuario B',
                    content: 'Discordo.',
                    createdAt: '2026-03-15T12:00:00Z',
                },
            ],
        }),
    popular: () => buildNewsComment({ likes: 9999 }),
};

export const buildNewsItem = (overrides: Partial<NewsItem> = {}): NewsItem => {
    newsCounter += 1;

    return {
        id: `news-${newsCounter}`,
        title: `Noticia Teste ${newsCounter}`,
        subtitle: `Subtitulo da noticia ${newsCounter}`,
        excerpt: 'Resumo curto da noticia para listagens.',
        content: ['Paragrafo 1 da noticia.', 'Paragrafo 2 da noticia.'],
        coverImage: `/news/news-${newsCounter}.jpg`,
        gallery: [],
        source: 'Manga Reader',
        sourceLogo: '/logos/manga-reader.png',
        category: 'Principais',
        tags: ['manga', 'noticia'],
        author: buildNewsAuthor(),
        publishedAt: '2026-03-20T10:00:00Z',
        updatedAt: undefined,
        readTime: 5,
        views: 1000,
        commentsCount: 25,
        trendingScore: 80,
        isExclusive: false,
        isFeatured: false,
        videoUrl: undefined,
        technicalSheet: undefined,
        reactions: buildNewsReaction(),
        comments: [],
        ...overrides,
    };
};

export const newsItemPresets = {
    principais: () => buildNewsItem({ category: 'Principais' }),
    lancamentos: () => buildNewsItem({ category: 'Lançamentos' }),
    adaptacoes: () => buildNewsItem({ category: 'Adaptações' }),
    industria: () => buildNewsItem({ category: 'Indústria' }),
    entrevistas: () => buildNewsItem({ category: 'Entrevistas' }),
    eventos: () => buildNewsItem({ category: 'Eventos' }),
    curiosidades: () => buildNewsItem({ category: 'Curiosidades' }),
    mercado: () => buildNewsItem({ category: 'Mercado' }),
    internacional: () => buildNewsItem({ category: 'Internacional' }),

    exclusive: () => buildNewsItem({ isExclusive: true }),
    featured: () => buildNewsItem({ isFeatured: true }),
    breaking: () =>
        buildNewsItem({
            isExclusive: true,
            isFeatured: true,
            trendingScore: 100,
        }),

    withVideo: () =>
        buildNewsItem({ videoUrl: 'https://youtube.com/watch?v=test' }),
    withGallery: () =>
        buildNewsItem({
            gallery: Array.from(
                { length: 5 },
                (_, i) => `/news/gallery-${i}.jpg`,
            ),
        }),
    withTechSheet: () =>
        buildNewsItem({
            technicalSheet: {
                Autor: 'Autor X',
                Editora: 'Editora Y',
                Volumes: '12',
            },
        }),

    noViews: () => buildNewsItem({ views: 0, commentsCount: 0 }),
    viralNews: () =>
        buildNewsItem({
            views: 1_000_000,
            commentsCount: 5000,
            reactions: newsReactionPresets.viral(),
        }),

    longRead: () => buildNewsItem({ readTime: 25 }),
    quickRead: () => buildNewsItem({ readTime: 1 }),

    withComments: () =>
        buildNewsItem({
            comments: Array.from({ length: 5 }, () => buildNewsComment()),
        }),
};

export const buildAllCategoryNews = (): NewsItem[] =>
    ALL_NEWS_CATEGORIES.map(category => buildNewsItem({ category }));

export const buildNewsList = (count = 10): NewsItem[] =>
    Array.from({ length: count }, () => buildNewsItem());

export const newsCategoryValues = ALL_NEWS_CATEGORIES;

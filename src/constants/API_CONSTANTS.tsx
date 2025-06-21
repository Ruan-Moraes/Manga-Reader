export enum ROUTES {
    WEB_URL = '/Manga-Reader',

    CATEGORIES_MOST_READ = '/categories?sort=most_read&status=all',
    CATEGORIES_ASCENSION = '/categories?sort=ascension&status=all',
    CATEGORIES_RANDOM = '/categories?sort=random&status=all',
    CATEGORIES_MOST_RECENT = '/categories?sort=most_recent&status=all',
}

export enum API_URLS {
    TITLE_URL = 'https://db-json-ten.vercel.app/',
    COMMENTS_URL = 'https://db-json-ten.vercel.app/',
}

export enum QUERY_KEYS {
    TITLES_IN_THE_CAROUSEL = 'titlesCarousel',
    TITLES_ON_THE_RISE = 'titlesMostViewed ',
    RANDOM_TITLES = 'randomTitles',
    UPDATED_TILTES = 'updatedTitles',

    COMMENTS = 'comments',
}

export enum ERROR_MESSAGES {
    FETCH_ERROR_BASE = 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.',

    FETCH_TITLES_ERROR = 'Ocorreu um erro ao buscar os títulos',
    FETCH_COMMENTS_ERROR = 'Ocorreu um erro ao buscar os comentários',
}

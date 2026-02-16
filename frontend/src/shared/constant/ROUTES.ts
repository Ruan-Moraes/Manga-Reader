export enum ROUTES {
    WEB_URL = '/Manga-Reader',

    CATEGORIES_MOST_READ = '/categories?sort=most_read&status=all',
    CATEGORIES_ASCENSION = '/categories?sort=ascension&status=all',
    CATEGORIES_RANDOM = '/categories?sort=random&status=all',
    CATEGORIES_MOST_RECENT = '/categories?sort=most_recent&status=all',

    FORUM = '/forum',
    FORUM_TOPIC = '/forum/:topicId',
}

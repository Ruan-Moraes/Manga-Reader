// Services
export {
    getNews,
    getNewsById,
    getRelatedNews,
    getNewsSources,
    isNewsFresh,
    formatRelativeDate,
    filterNews,
    newsCategories,
} from './service/newsService';

// Types
export type {
    NewsCategory,
    NewsReaction,
    NewsComment,
    NewsAuthor,
    NewsItem,
    NewsFilter,
} from './type/news.types';

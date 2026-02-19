// Hooks
export { default as useNews } from './hook/useNews';
export { default as useNewsDetails } from './hook/useNewsDetails';

// Components
export { default as NewsCard } from './component/NewsCard';
export { default as HeroNews } from './component/HeroNews';
export { default as NewsFilterPanel } from './component/NewsFilterPanel';

// Services
export {
    getNews,
    getNewsById,
    getRelatedNews,
    getNewsSources,
    isNewsFresh,
    formatRelativeDate,
    formatNewsDate,
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

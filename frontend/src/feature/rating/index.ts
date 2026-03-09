// Hooks
export { default as useRating } from './hook/useRating';
export { default as useRatings } from './hook/useRatings';

// Components
export { default as RatingStars } from './component/RatingStars';
export { default as RatingModal } from './component/modal/RatingModal';
export { default as RecentReviews } from './component/RecentReviews';

// Services
export {
    getRatingsAverage,
    getUserReviews,
    updateReview,
    deleteReview,
    submitRating,
    getRatingsByTitleId,
} from './service/ratingService';

// Types
export type { MangaRating, CategoryRatings } from './type/rating.types';

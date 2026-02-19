// Services
export {
    getForumTopics,
    getForumTopicById,
    getForumTopicByIdSync,
    getForumCategories,
    filterForumTopics,
    formatRelativeDate,
    getCategoryColor,
    paginateTopics,
    forumCategories,
    forumSortOptions,
    roleLabel,
    roleBadgeColor,
    TOPICS_PER_PAGE,
} from './service/forumService';

// Hooks
export { default as useForumPage } from './hook/useForumPage';
export { default as useForumTopic } from './hook/useForumTopic';

// Components
export { default as TopicCard } from './component/TopicCard';
export { default as Pagination } from './component/Pagination';
export { default as ForumStats } from './component/ForumStats';
export { default as ReplyCard } from './component/ReplyCard';
export { default as RelatedTopicCard } from './component/RelatedTopicCard';

// Types
export type {
    ForumCategory,
    ForumAuthor,
    ForumReply,
    ForumTopic,
    ForumSort,
    ForumFilter,
} from './type/forum.types';

// Services
export {
    getForumTopics,
    getForumTopicById,
    getForumCategories,
    filterForumTopics,
    formatRelativeDate,
    getCategoryColor,
    paginateTopics,
    forumCategories,
    forumSortOptions,
    roleLabelKey,
    roleBadgeColor,
    TOPICS_PER_PAGE,
} from './api/forumService';

// Hooks
export { default as useForumPage } from './model/useForumPage';
export { default as useForumTopic } from './model/useForumTopic';

// Components
export { default as TopicCard } from './ui/TopicCard';
export { default as Pagination } from './ui/Pagination';
export { default as ForumStats } from './ui/ForumStats';
export { default as ReplyCard } from './ui/ReplyCard';
export { default as RelatedTopicCard } from './ui/RelatedTopicCard';

// Types
export type { ForumCategory, ForumAuthor, ForumReply, ForumTopic, ForumSort, ForumFilter } from './model/forum.types';

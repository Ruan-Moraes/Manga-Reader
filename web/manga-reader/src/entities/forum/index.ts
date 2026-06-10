// Services
export {
    getForumTopics,
    getForumTopicById,
    getForumCategories,
    voteForumTopic,
    removeForumTopicVote,
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
export { default as ForumTopicCard } from './ui/ForumTopicCard';
export { default as ForumStats } from './ui/ForumStats';

// Types
export type { ForumCategory, ForumAuthor, ForumReply, ForumTopic, ForumSort, ForumFilter } from './model/forum.types';
export type { TopicAuthor, TopicData, ReplyData } from './model/topic-detail.types';

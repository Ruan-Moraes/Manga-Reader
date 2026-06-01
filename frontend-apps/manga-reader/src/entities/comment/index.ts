// Public API — comment ENTITY (the comment model + dumb display atoms).
// Interactions (compose/edit/reply/react/sort) live in `@features/comment`.

// Types
export type { CommentData, CommentWithChildren, CommentProps } from './model/comment.types';

// Data hooks
export { default as useComments } from './model/useComments';
export { default as useCommentPagination } from './model/useCommentPagination';
export { default as useCommentTree } from './model/internal/useCommentTree';

// Sort state (display ordering)
export { CommentSortProvider, useCommentSortContext } from './model/CommentSortContext';

// Services (data access)
export {
    getCommentsByTitleId,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    getUserReactions,
} from './api/commentService';

// Display atoms (dumb — props/callbacks only)
export { default as CommentUser } from './ui/header/CommentUser';
export { default as CommentMetadata } from './ui/header/CommentMetadata';
export { default as CommentContent } from './ui/body/CommentContent';
export { default as CommentActions } from './ui/footer/CommentActions';

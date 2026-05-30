// features/comment/index.ts
export { default as useComments } from './model/useComments';
export { default as useCommentPagination } from './model/useCommentPagination';
export { CommentSortProvider, useCommentSortContext } from './model/CommentSortContext';
export { default as CommentsSection } from './ui/CommentsSection';
export { default as CommentsList } from './ui/CommentsList';
export { default as CommentInput } from './ui/CommentInput';
export { default as CommentUser } from './ui/header/CommentUser';
export { default as SortComments } from './ui/SortComments';
export type { CommentData, CommentWithChildren } from './model/comment.types';

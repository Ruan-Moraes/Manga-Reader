import { UserTypes } from './UserTypes';

export type CommentTypes = {
  commentId: string;
  parentCommentId?: string;

  user: UserTypes;

  isOwner?: boolean;
  isHighlighted?: boolean;
  wasEdited?: boolean;

  commentData: Date;
  commentText?: string;
  commentImage?: string;

  dislikeCount: string;
  likeCount: string;
};

export type CommentWithChildrenTypes = CommentTypes & {
  children: CommentWithChildrenTypes[];
};

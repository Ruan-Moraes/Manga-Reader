import { type User } from '@feature/auth';

export type CommentData = {
    id: string;
    parentCommentId: string | null;

    user: User;

    isOwner: boolean;
    isHighlighted: boolean;
    wasEdited: boolean;

    createdAt: string;

    textContent: string | null;
    imageContent: string | null;

    dislikeCount: string;
    likeCount: string;
};

export type CommentWithChildren = CommentData & {
    children: CommentWithChildren[];
};

import { UserTypes } from './UserTypes';

export type CommentTypes = {
    id: string;
    parentCommentId: string | null;

    user: UserTypes;

    isOwner: boolean;
    isHighlighted: boolean;
    wasEdited: boolean;

    createdAt: string;

    textContent: string | null;
    imageContent: string | null;

    dislikeCount: string;
    likeCount: string;
};

export type CommentWithChildrenTypes = CommentTypes & {
    children: CommentWithChildrenTypes[];
};

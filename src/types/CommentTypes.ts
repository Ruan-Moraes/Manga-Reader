import {UserTypes} from './UserTypes';

export type CommentTypes = {
    id: string;
    parentCommentId?: string;

    user: UserTypes;

    isOwner?: boolean;
    isHighlighted?: boolean;
    wasEdited?: boolean;

    createdAt: string;
    updatedAt: string;

    textContent?: string;
    imageContent?: string;

    dislikeCount: string;
    likeCount: string;
};

export type CommentWithChildrenTypes = CommentTypes & {
    children: CommentWithChildrenTypes[];
};

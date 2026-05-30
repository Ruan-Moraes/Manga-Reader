import { type User } from '@feature/user';

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

    language?: string;

    userReaction?: 'LIKE' | 'DISLIKE' | null;
};

export type CommentWithChildren = CommentData & {
    children: CommentWithChildren[];
};

export type CommentProps = {
    nestedLevel?: number;
    parentUserName?: string | null;
    titleId: string;
    onClickProfile: (user: User) => void;
    onClickEdit: (id: string, newTextContent: string | null, newImageContent: string | null) => void;
    onClickDelete: (id: string) => void;
    onClickReply: (id: string, titleId: string, textContent: string | null, imageContent: string | null) => void;
    onLike: (id: string) => void;
    onDislike: (id: string) => void;
} & CommentData;

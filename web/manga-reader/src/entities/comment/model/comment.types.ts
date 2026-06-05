import { type User } from '@entities/user/@x/comment';

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

export type CommentReactions = Record<string, string | null | undefined>;

export type CommentCallbacks = {
    titleId: string;
    /** Profundidade visual máxima antes do link "continuar conversa" (mobile 2 / desktop 3). */
    maxDepth: number;
    reactionsMap: CommentReactions;
    onClickProfile: (user: User) => void;
    onClickEdit: (id: string, newTextContent: string | null, newImageContent: string | null) => void;
    onClickDelete: (id: string) => void;
    onClickReply: (id: string, titleId: string, textContent: string | null, imageContent: string | null) => void;
    onLike: (id: string) => void;
    onDislike: (id: string) => void;
};

export type CommentProps = CommentCallbacks & {
    data: CommentWithChildren;
    depth?: number;
    parentUserName?: string | null;
};

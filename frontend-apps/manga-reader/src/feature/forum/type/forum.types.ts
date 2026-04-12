export type ForumCategory =
    | 'Geral'
    | 'Recomendações'
    | 'Spoilers'
    | 'Suporte'
    | 'Off-topic'
    | 'Teorias'
    | 'Fanart'
    | 'Notícias';

export type ForumAuthor = {
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'moderator' | 'member';
    postCount: number;
    joinedAt: string;
};

export type ForumReply = {
    id: string;
    author: ForumAuthor;
    content: string;
    createdAt: string;
    likes: number;
    isEdited: boolean;
    isBestAnswer: boolean;
};

export type ForumTopic = {
    id: string;
    title: string;
    content: string;
    author: ForumAuthor;
    category: ForumCategory;
    tags: string[];
    createdAt: string;
    lastActivityAt: string;
    viewCount: number;
    replyCount: number;
    likeCount: number;
    isPinned: boolean;
    isLocked: boolean;
    isSolved: boolean;
    replies: ForumReply[];
};

export type ForumSort =
    | 'recent'
    | 'popular'
    | 'most-replies'
    | 'unanswered'
    | 'oldest';

export type ForumFilter = {
    query?: string;
    category?: ForumCategory | 'all';
    sort?: ForumSort;
    page?: number;
    pageSize?: number;
    onlyPinned?: boolean;
    onlySolved?: boolean;
};

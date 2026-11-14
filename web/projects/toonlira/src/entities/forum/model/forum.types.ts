export type ForumCategory = 'Geral' | 'Recomendações' | 'Spoilers' | 'Suporte' | 'Off-topic' | 'Teorias' | 'Fanart' | 'Notícias';

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
    updatedAt?: string;
    // Voto padronizado (modelo único): respostas são comentários unificados;
    // votar nelas usa os endpoints de /api/comments.
    upvotes: number;
    downvotes: number;
    edited: boolean;
    isBestAnswer: boolean;
};

export type ForumTopic = {
    id: string;
    title: string;
    content: string;
    author: ForumAuthor;
    category: ForumCategory;
    tags: string[];
    language?: string;
    createdAt: string;
    updatedAt?: string;
    lastActivityAt: string;
    viewCount: number;
    replyCount: number;
    // Voto padronizado (modelo único, igual a resenhas/comentários).
    upvotes: number;
    downvotes: number;
    myVote?: 'up' | 'down' | null;
    isPinned: boolean;
    isLocked: boolean;
    isSolved: boolean;
    edited?: boolean;
    // Listagem não retorna replies (só replyCount); detalhe
    // (getForumTopicById) traz o array completo.
    replies?: ForumReply[];
};

export type ForumSort = 'recent' | 'popular' | 'most-replies' | 'unanswered' | 'oldest';

export type ForumFilter = {
    query?: string;
    category?: ForumCategory | 'all';
    sort?: ForumSort;
    page?: number;
    pageSize?: number;
    onlyPinned?: boolean;
    onlySolved?: boolean;
};

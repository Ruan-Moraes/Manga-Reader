// Shapes for the forum topic-detail view (currently served by the mock in
// `@mock/forumTopic` via the `pages/forum` page hook; swap to API later).

export type TopicAuthor = {
    name: string;
    handle: string;
    badge: 'mod' | 'author' | undefined;
};

export type TopicData = {
    id: string;
    title: string;
    category: string;
    pinned: boolean;
    author: TopicAuthor;
    /** ISO de criação — formatado na exibição (relativo + tooltip dia+hora). */
    postedAt: string;
    /** ISO da última modificação — tooltip no selo "(editado)". */
    updatedAt?: string;
    /** Conteúdo editado após a criação. */
    edited?: boolean;
    views: number;
    replies: number;
    live: number;
    content: string;
};

export type ReplyData = {
    id: string;
    author: TopicAuthor;
    /** ISO de criação — formatado na exibição (relativo + tooltip dia+hora). */
    when: string;
    /** ISO da última modificação — tooltip no selo "(editado)". */
    updatedAt?: string;
    /** Conteúdo editado após a criação. */
    edited?: boolean;
    upvotes: number;
    downvotes: number;
    children: string;
};

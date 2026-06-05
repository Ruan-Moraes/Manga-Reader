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
    postedAt: string;
    views: number;
    replies: number;
    live: number;
    content: string;
};

export type ReplyData = {
    id: string;
    author: TopicAuthor;
    when: string;
    upvotes: number;
    downvotes: number;
    children: string;
};

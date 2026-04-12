import type {
    ForumAuthor,
    ForumCategory,
    ForumReply,
    ForumSort,
    ForumTopic,
} from '@feature/forum/type/forum.types';

let forumTopicCounter = 0;
let forumAuthorCounter = 0;
let forumReplyCounter = 0;

const ALL_FORUM_CATEGORIES: ForumCategory[] = [
    'Geral',
    'Recomendações',
    'Spoilers',
    'Suporte',
    'Off-topic',
    'Teorias',
    'Fanart',
    'Notícias',
];

const ALL_FORUM_SORTS: ForumSort[] = [
    'recent',
    'popular',
    'most-replies',
    'unanswered',
    'oldest',
];

export const buildForumAuthor = (
    overrides: Partial<ForumAuthor> = {},
): ForumAuthor => {
    forumAuthorCounter += 1;

    return {
        id: `forum-author-${forumAuthorCounter}`,
        name: `Forumista ${forumAuthorCounter}`,
        avatar: `/avatars/forum-${forumAuthorCounter}.png`,
        role: 'member',
        postCount: 50,
        joinedAt: '2025-06-01T10:00:00Z',
        ...overrides,
    };
};

export const forumAuthorPresets = {
    admin: () => buildForumAuthor({ role: 'admin', postCount: 5000 }),
    moderator: () => buildForumAuthor({ role: 'moderator', postCount: 2000 }),
    member: () => buildForumAuthor({ role: 'member', postCount: 50 }),
    newcomer: () =>
        buildForumAuthor({
            role: 'member',
            postCount: 0,
            joinedAt: '2026-04-01T00:00:00Z',
        }),
    veteran: () =>
        buildForumAuthor({
            role: 'member',
            postCount: 9999,
            joinedAt: '2018-01-01T00:00:00Z',
        }),
};

export const buildForumReply = (
    overrides: Partial<ForumReply> = {},
): ForumReply => {
    forumReplyCounter += 1;

    return {
        id: `forum-reply-${forumReplyCounter}`,
        author: buildForumAuthor(),
        content: `Conteudo da resposta ${forumReplyCounter}.`,
        createdAt: '2026-03-20T10:00:00Z',
        likes: 5,
        isEdited: false,
        isBestAnswer: false,
        ...overrides,
    };
};

export const forumReplyPresets = {
    plain: () => buildForumReply(),
    edited: () =>
        buildForumReply({
            isEdited: true,
            content: 'Conteudo editado da resposta.',
        }),
    bestAnswer: () => buildForumReply({ isBestAnswer: true, likes: 50 }),
    popular: () => buildForumReply({ likes: 999 }),
    fromAdmin: () => buildForumReply({ author: forumAuthorPresets.admin() }),
};

export const buildForumTopic = (
    overrides: Partial<ForumTopic> = {},
): ForumTopic => {
    forumTopicCounter += 1;

    return {
        id: `forum-topic-${forumTopicCounter}`,
        title: `Topico ${forumTopicCounter}`,
        content: `Conteudo do topico ${forumTopicCounter}.`,
        author: buildForumAuthor(),
        category: 'Geral',
        tags: ['discussao'],
        createdAt: '2026-03-15T10:00:00Z',
        lastActivityAt: '2026-03-20T10:00:00Z',
        viewCount: 100,
        replyCount: 5,
        likeCount: 10,
        isPinned: false,
        isLocked: false,
        isSolved: false,
        replies: [],
        ...overrides,
    };
};

export const forumTopicPresets = {
    geral: () => buildForumTopic({ category: 'Geral' }),
    recomendacoes: () => buildForumTopic({ category: 'Recomendações' }),
    spoilers: () => buildForumTopic({ category: 'Spoilers' }),
    suporte: () => buildForumTopic({ category: 'Suporte' }),
    offTopic: () => buildForumTopic({ category: 'Off-topic' }),
    teorias: () => buildForumTopic({ category: 'Teorias' }),
    fanart: () => buildForumTopic({ category: 'Fanart' }),
    noticias: () => buildForumTopic({ category: 'Notícias' }),

    pinned: () => buildForumTopic({ isPinned: true }),
    locked: () => buildForumTopic({ isLocked: true }),
    solved: () =>
        buildForumTopic({
            isSolved: true,
            replies: [forumReplyPresets.bestAnswer()],
        }),

    noReplies: () => buildForumTopic({ replyCount: 0, replies: [] }),
    withReplies: () =>
        buildForumTopic({
            replyCount: 20,
            replies: Array.from({ length: 20 }, () => buildForumReply()),
        }),

    trending: () =>
        buildForumTopic({
            viewCount: 50000,
            replyCount: 500,
            likeCount: 1000,
        }),

    withTags: () =>
        buildForumTopic({
            tags: ['manga', 'shonen', 'recomendacao', 'novato'],
        }),

    locked_solved_pinned: () =>
        buildForumTopic({
            isPinned: true,
            isLocked: true,
            isSolved: true,
        }),
};

export const buildAllCategoryTopics = (): ForumTopic[] =>
    ALL_FORUM_CATEGORIES.map(category => buildForumTopic({ category }));

export const buildForumTopicList = (count = 10): ForumTopic[] =>
    Array.from({ length: count }, () => buildForumTopic());

export const forumCategoryValues = ALL_FORUM_CATEGORIES;
export const forumSortValues = ALL_FORUM_SORTS;

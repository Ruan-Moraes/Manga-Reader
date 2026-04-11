import type {
    CommentSummary,
    EnrichedProfile,
    PrivacySettings,
    ProfileStats,
    RecommendedTitle,
    SocialLinkResponse,
    User,
    ViewHistoryItem,
    VisibilitySetting,
} from '@feature/user/type/user.types';

let userCounter = 0;
let recommendationCounter = 0;
let viewHistoryCounter = 0;
let commentSummaryCounter = 0;
let socialLinkCounter = 0;

export const buildUser = (overrides: Partial<User> = {}): User => {
    userCounter += 1;

    return {
        id: `user-${userCounter}`,
        photo: '/avatars/default.png',
        name: `Usuario Teste ${userCounter}`,
        email: `usuario${userCounter}@teste.com`,
        role: 'user',
        adultContentPreference: 'BLUR',
        bio: 'Bio padrao do usuario de teste.',
        bannerUrl: '/banners/default.png',
        createdAt: '2025-06-01T12:00:00Z',
        moderator: { isModerator: false, since: new Date('2025-06-01') },
        member: { isMember: true, since: new Date('2025-06-01') },
        socialMediasLinks: [],
        statistics: { comments: 10, likes: 50, dislikes: 2 },
        recommendedTitles: [],
        ...overrides,
    };
};

export const userPresets = {
    member: () => buildUser({ role: 'user' }),
    poster: () => buildUser({ role: 'poster' }),
    admin: () => buildUser({ role: 'admin' }),

    withoutBio: () => buildUser({ bio: undefined }),
    withFullBio: () =>
        buildUser({
            bio: 'Leitor voraz de manga, manhwa e manhua. Apaixonado por seinen e thrillers psicologicos.',
        }),

    withoutSocialLinks: () => buildUser({ socialMediasLinks: [] }),
    withSocialLinks: () =>
        buildUser({
            socialMediasLinks: [
                { name: 'twitter', link: 'https://twitter.com/teste' },
                { name: 'instagram', link: 'https://instagram.com/teste' },
            ],
        }),

    moderator: () =>
        buildUser({
            role: 'poster',
            moderator: { isModerator: true, since: new Date('2024-01-01') },
        }),

    statsZero: () =>
        buildUser({ statistics: { comments: 0, likes: 0, dislikes: 0 } }),
    statsHigh: () =>
        buildUser({
            statistics: { comments: 9999, likes: 50000, dislikes: 100 },
        }),

    adultContentShow: () => buildUser({ adultContentPreference: 'SHOW' }),
    adultContentHide: () => buildUser({ adultContentPreference: 'HIDE' }),

    withoutPhoto: () => buildUser({ photo: '' }),
};

// ---------------------------------------------------------------------------
// EnrichedProfile sub-records
// ---------------------------------------------------------------------------

export const buildRecommendedTitle = (
    overrides: Partial<RecommendedTitle> = {},
): RecommendedTitle => {
    recommendationCounter += 1;

    return {
        titleId: `rec-title-${recommendationCounter}`,
        titleName: `Titulo Recomendado ${recommendationCounter}`,
        titleCover: `/covers/rec-${recommendationCounter}.jpg`,
        position: recommendationCounter % 10,
        ...overrides,
    };
};

export const buildViewHistoryItem = (
    overrides: Partial<ViewHistoryItem> = {},
): ViewHistoryItem => {
    viewHistoryCounter += 1;

    return {
        titleId: `view-title-${viewHistoryCounter}`,
        titleName: `Titulo Visto ${viewHistoryCounter}`,
        titleCover: `/covers/view-${viewHistoryCounter}.jpg`,
        viewedAt: '2026-04-01T15:30:00Z',
        ...overrides,
    };
};

export const buildCommentSummary = (
    overrides: Partial<CommentSummary> = {},
): CommentSummary => {
    commentSummaryCounter += 1;

    return {
        id: `comment-summary-${commentSummaryCounter}`,
        titleId: `title-${commentSummaryCounter}`,
        textContent: `Resumo de comentario ${commentSummaryCounter}.`,
        createdAt: '2026-03-15T10:00:00Z',
        ...overrides,
    };
};

export const buildSocialLinkResponse = (
    overrides: Partial<SocialLinkResponse> = {},
): SocialLinkResponse => {
    socialLinkCounter += 1;

    return {
        id: `social-link-${socialLinkCounter}`,
        platform: 'twitter',
        url: `https://twitter.com/usuario${socialLinkCounter}`,
        ...overrides,
    };
};

export const buildPrivacySettings = (
    overrides: Partial<PrivacySettings> = {},
): PrivacySettings => ({
    commentVisibility: 'PUBLIC',
    viewHistoryVisibility: 'PUBLIC',
    ...overrides,
});

export const privacySettingsPresets = {
    allPublic: (): PrivacySettings =>
        buildPrivacySettings({
            commentVisibility: 'PUBLIC',
            viewHistoryVisibility: 'PUBLIC',
        }),
    allPrivate: (): PrivacySettings =>
        buildPrivacySettings({
            commentVisibility: 'PRIVATE',
            viewHistoryVisibility: 'PRIVATE',
        }),
    doNotTrack: (): PrivacySettings =>
        buildPrivacySettings({
            commentVisibility: 'DO_NOT_TRACK',
            viewHistoryVisibility: 'DO_NOT_TRACK',
        }),
    mixed: (): PrivacySettings =>
        buildPrivacySettings({
            commentVisibility: 'PUBLIC',
            viewHistoryVisibility: 'PRIVATE',
        }),
};

export const buildProfileStats = (
    overrides: Partial<ProfileStats> = {},
): ProfileStats => ({
    comments: 25,
    ratings: 12,
    libraryTotal: 47,
    lendo: 10,
    queroLer: 25,
    concluido: 12,
    ...overrides,
});

let enrichedProfileCounter = 0;

export const buildEnrichedProfile = (
    overrides: Partial<EnrichedProfile> = {},
): EnrichedProfile => {
    enrichedProfileCounter += 1;

    return {
        id: `profile-${enrichedProfileCounter}`,
        name: `Perfil Teste ${enrichedProfileCounter}`,
        email: `profile${enrichedProfileCounter}@teste.com`,
        bio: 'Bio padrao.',
        photoUrl: '/avatars/default.png',
        bannerUrl: '/banners/default.png',
        role: 'user',
        socialLinks: [],
        createdAt: '2025-06-01T12:00:00Z',
        stats: buildProfileStats(),
        recommendations: [],
        recentComments: [],
        recentViewHistory: [],
        privacySettings: buildPrivacySettings(),
        isOwner: false,
        ...overrides,
    };
};

export const enrichedProfilePresets = {
    owner: () => buildEnrichedProfile({ isOwner: true }),
    visitor: () => buildEnrichedProfile({ isOwner: false }),

    fullyPopulated: () =>
        buildEnrichedProfile({
            isOwner: true,
            socialLinks: Array.from({ length: 3 }, () =>
                buildSocialLinkResponse(),
            ),
            recommendations: Array.from({ length: 10 }, () =>
                buildRecommendedTitle(),
            ),
            recentComments: Array.from({ length: 5 }, () =>
                buildCommentSummary(),
            ),
            recentViewHistory: Array.from({ length: 5 }, () =>
                buildViewHistoryItem(),
            ),
        }),

    emptyProfile: () =>
        buildEnrichedProfile({
            socialLinks: [],
            recommendations: [],
            recentComments: [],
            recentViewHistory: [],
        }),

    privateComments: () =>
        buildEnrichedProfile({
            recentComments: null,
            privacySettings: privacySettingsPresets.mixed(),
        }),

    noPrivacySettings: () =>
        buildEnrichedProfile({ isOwner: false, privacySettings: null }),

    adminProfile: () => buildEnrichedProfile({ role: 'admin' }),
    posterProfile: () => buildEnrichedProfile({ role: 'poster' }),

    withRecommendationsCapped: () =>
        buildEnrichedProfile({
            recommendations: Array.from({ length: 10 }, () =>
                buildRecommendedTitle(),
            ),
        }),

    withSingleRecommendation: () =>
        buildEnrichedProfile({
            recommendations: [buildRecommendedTitle()],
        }),
};

export const visibilityValues: VisibilitySetting[] = [
    'PUBLIC',
    'PRIVATE',
    'DO_NOT_TRACK',
];

export const buildUserList = (count = 10): User[] =>
    Array.from({ length: count }, () => buildUser());

export type UserRole = 'user' | 'poster' | 'admin';

export type VisibilitySetting = 'PUBLIC' | 'PRIVATE' | 'DO_NOT_TRACK';

export type User = {
    id: string;
    photo: string;
    name: string;
    email?: string;
    role?: UserRole;
    bio?: string;
    bannerUrl?: string;
    createdAt?: string;
    moderator?: {
        isModerator: boolean;
        since: Date;
    };
    member?: {
        isMember: boolean;
        since: Date;
    };
    socialMediasLinks?: {
        name: string;
        link: string;
    }[];
    statistics?: {
        comments?: number;
        likes?: number;
        dislikes?: number;
    };
    recommendedTitles?: {
        image: string;
        link: string;
    }[];
};

export type ProfileStats = {
    comments: number;
    ratings: number;
    libraryTotal: number;
    lendo: number;
    queroLer: number;
    concluido: number;
};

export type RecommendedTitle = {
    titleId: string;
    titleName: string;
    titleCover: string;
    position: number;
};

export type ViewHistoryItem = {
    titleId: string;
    titleName: string;
    titleCover: string;
    viewedAt: string;
};

export type CommentSummary = {
    id: string;
    titleId: string;
    textContent: string;
    createdAt: string;
};

export type PrivacySettings = {
    commentVisibility: VisibilitySetting;
    viewHistoryVisibility: VisibilitySetting;
};

export type SocialLinkResponse = {
    id: string;
    platform: string;
    url: string;
};

export type EnrichedProfile = {
    id: string;
    name: string;
    email?: string;
    bio?: string;
    photoUrl?: string;
    bannerUrl?: string;
    role: string;
    socialLinks: SocialLinkResponse[];
    createdAt?: string;
    stats: ProfileStats;
    recommendations: RecommendedTitle[];
    recentComments: CommentSummary[] | null;
    recentViewHistory: ViewHistoryItem[] | null;
    privacySettings: PrivacySettings | null;
    isOwner: boolean;
};

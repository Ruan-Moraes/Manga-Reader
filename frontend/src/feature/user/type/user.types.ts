export type UserRole = 'user' | 'poster' | 'admin';

export type User = {
    id: string;
    photo: string;
    name: string;
    role?: UserRole;
    bio?: string;
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

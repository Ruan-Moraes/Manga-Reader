export type GroupStatus = 'active' | 'inactive' | 'hiatus';

export type GroupRole =
    | 'Líder'
    | 'Tradutor(a)'
    | 'Revisor(a)'
    | 'QC'
    | 'Cleaner'
    | 'Typesetter';

export type UserPost = {
    id: string;
    summary: string;
    createdAt: string;
    titleName?: string;
    link: string;
};

export type GroupMember = {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    role: GroupRole;
    joinedAt: string;
    groups: {
        id: string;
        name: string;
    }[];
    recentPosts: UserPost[];
};

export type GroupWork = {
    id: string;
    title: string;
    cover: string;
    chapters: number;
    status: 'ongoing' | 'completed';
    popularity: number;
    updatedAt: string;
    genres: string[];
};

export type GroupTypes = {
    id: string;
    name: string;
    logo: string;
    banner: string;
    description: string;
    website: string;
    totalTitles: number;
    foundedYear: number;
    platformJoinedAt: string;
    status: GroupStatus;
    members: GroupMember[];
    genres: string[];
    rating: number;
    popularity: number;
    translatedWorks: GroupWork[];
    translatedTitleIds: string[];
};

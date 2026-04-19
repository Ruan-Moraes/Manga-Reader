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

export type GroupSupporter = {
    id: string;
    name: string;
    avatar: string;
    joinedAt: string;
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

export type Group = {
    id: string;
    name: string;
    username: string;
    logo: string;
    banner: string;
    description: string;
    website: string;
    totalTitles: number;
    foundedYear: number;
    platformJoinedAt: string;
    status: GroupStatus;
    members: GroupMember[];
    supporters: GroupSupporter[];
    genres: string[];
    focusTags: string[];
    rating: number;
    popularity: number;
    translatedWorks: GroupWork[];
    translatedTitleIds: string[];
};

export type GroupSummary = {
    id: string;
    name: string;
    username: string;
    logo: string;
    banner: string;
    description: string;
    website: string;
    totalTitles: number;
    foundedYear: number;
    platformJoinedAt: string;
    status: GroupStatus;
    genres: string[];
    focusTags: string[];
    rating: number;
    popularity: number;
};

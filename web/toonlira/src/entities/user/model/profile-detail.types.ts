// Shape for the public profile-detail view (served by `pages/profile`'s
// `useProfileData` hook, backed by the real profile endpoints).

export type ProfileData = {
    handle: string;
    name: string;
    bio: string;
    verified: boolean;
    worksRead: number;
    reviews: number;
    followers: number;
    following: number;
    genres: string[];
    isOwn?: boolean;
};

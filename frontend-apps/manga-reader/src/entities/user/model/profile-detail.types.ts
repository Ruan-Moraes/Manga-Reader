// Shape for the public profile-detail view (currently served by the mock in
// `@mock/userProfile` via the `pages/profile` page hook; swap to API later).

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

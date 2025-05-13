export type UserTypes = {
  id: string;
  photo: string;
  name: string;
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

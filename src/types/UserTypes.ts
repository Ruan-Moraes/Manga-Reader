export type UserTypes = {
  isHighlighted: boolean;
  isModerator: boolean;
  isMember: boolean;

  name: string;
  photo: string;
  tags?: string[];
  bio?: string;
  socialMediasLinks?: {
    [key: string]: string;
  };
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

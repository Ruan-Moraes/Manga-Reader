import type { User } from '../type/user.types';

export const buildUserModalPayload = (user: User): User => ({
    id: user.id || 'system-generated-id',
    role: user.role,
    moderator: user.moderator,
    member: user.member,
    name: user.name,
    photo: user.photo || '',
    bio: user.bio,
    socialMediasLinks: user.socialMediasLinks,
    statistics: user.statistics,
    recommendedTitles: user.recommendedTitles,
});

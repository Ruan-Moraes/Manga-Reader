export type UserRole = 'MEMBER' | 'ADMIN' | 'MODERATOR';

export interface User {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    role: UserRole;
    adultContentPreference?: string;
}

import { UserTypes } from '../../types/UserTypes';

const AUTH_KEY = 'manga-reader:auth-user';

export const mockUser: UserTypes = {
    id: 'user-1',
    photo: 'https://i.pravatar.cc/100?img=32',
    name: 'Leitor Demo',
    bio: 'Fã de fantasia, ação e slice of life. Sempre em busca do próximo mangá para maratonar.',
    member: {
        isMember: true,
        since: new Date('2024-03-18'),
    },
    statistics: {
        comments: 28,
        likes: 74,
        dislikes: 2,
    },
};

export const getCurrentUser = () => {
    const storage = localStorage.getItem(AUTH_KEY);

    if (!storage) {
        return null;
    }

    return JSON.parse(storage) as UserTypes;
};

export const signInMockUser = () => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser));

    return mockUser;
};

export const signOutMockUser = () => {
    localStorage.removeItem(AUTH_KEY);
};

export const updateCurrentUser = (partialUser: Partial<UserTypes>) => {
    const user = getCurrentUser();

    if (!user) {
        return null;
    }

    const updatedUser = { ...user, ...partialUser };

    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));

    return updatedUser;
};

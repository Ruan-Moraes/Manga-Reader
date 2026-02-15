import { useCallback, useEffect, useState } from 'react';

import { UserTypes } from '../../types/UserTypes';

import {
    getCurrentUser,
    signInMockUser,
    signOutMockUser,
    updateCurrentUser,
} from '../../services/mock/mockAuthService';

const useAuth = () => {
    const [user, setUser] = useState<UserTypes | null>(null);

    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    const login = useCallback(() => {
        const loggedUser = signInMockUser();

        setUser(loggedUser);

        return loggedUser;
    }, []);

    const logout = useCallback(() => {
        signOutMockUser();
        setUser(null);
    }, []);

    const updateProfile = useCallback((partialUser: Partial<UserTypes>) => {
        const updatedUser = updateCurrentUser(partialUser);

        setUser(updatedUser);

        return updatedUser;
    }, []);

    return {
        user,
        isLoggedIn: Boolean(user),
        login,
        logout,
        updateProfile,
    };
};

export default useAuth;

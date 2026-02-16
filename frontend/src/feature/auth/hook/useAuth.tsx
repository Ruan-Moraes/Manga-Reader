import { useCallback, useEffect, useState } from 'react';

import { User } from '../type/user.types';

import {
    getCurrentUser,
    signIn,
    signOut,
    updateProfile as updateProfileService,
} from '../service/authService';

const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    const login = useCallback(async () => {
        const loggedUser = await signIn();
        setUser(loggedUser);
        return loggedUser;
    }, []);

    const logout = useCallback(async () => {
        await signOut();
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (partialUser: Partial<User>) => {
        const updatedUser = await updateProfileService(partialUser);
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

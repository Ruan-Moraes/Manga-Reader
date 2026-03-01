import { useCallback, useEffect, useState } from 'react';

import { type User, type UserRole } from '@feature/user';

import {
    getCurrentUser,
    signIn,
    signInAs,
    signOut,
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

    const loginAs = useCallback(async (role: UserRole) => {
        const loggedUser = await signInAs(role);

        setUser(loggedUser);

        return loggedUser;
    }, []);

    const logout = useCallback(async () => {
        await signOut();

        setUser(null);
    }, []);

    return {
        user,
        setUser,
        isLoggedIn: Boolean(user),
        login,
        loginAs,
        logout,
    };
};

export default useAuth;

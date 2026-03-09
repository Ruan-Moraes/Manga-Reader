import { useCallback, useEffect, useState } from 'react';

import { type User } from '@feature/user';

import {
    getCurrentUser,
    getStoredSession,
    signIn,
    signOut,
} from '../service/authService';

type SignInPayload = { email: string; password: string };

const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const session = getStoredSession();

        if (!session) return;

        getCurrentUser().then(setUser).catch(() => setUser(null));
    }, []);

    const login = useCallback(async (payload: SignInPayload) => {
        const authResponse = await signIn(payload);
        const loggedUser = authResponse as unknown as User;

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
        logout,
    };
};

export default useAuth;

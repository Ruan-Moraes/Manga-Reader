import { useCallback, useEffect, useState } from 'react';

import { type User } from '@feature/user';

import {
    getCurrentUser,
    getStoredSession,
    mapAuthResponseToUser,
    signIn,
    signOut,
    signUp as signUpService,
    type SignUpRequest,
} from '../service/authService';

type SignInPayload = { email: string; password: string };

const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const session = getStoredSession();

        if (!session) return;

        getCurrentUser()
            .then(auth => {
                if (auth) setUser(mapAuthResponseToUser(auth));
                else setUser(null);
            })
            .catch(() => setUser(null));
    }, []);

    const login = useCallback(async (payload: SignInPayload) => {
        const authResponse = await signIn(payload);
        const loggedUser = mapAuthResponseToUser(authResponse);

        setUser(loggedUser);

        return loggedUser;
    }, []);

    const register = useCallback(async (payload: SignUpRequest) => {
        const authResponse = await signUpService(payload);
        const loggedUser = mapAuthResponseToUser(authResponse);

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
        register,
        logout,
    };
};

export default useAuth;

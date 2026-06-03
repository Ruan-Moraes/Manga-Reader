import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { type User } from '@entities/user';

import { getCurrentUser, getStoredSession, mapAuthResponseToUser, signIn, signOut, signUp as signUpService, type SignUpRequest } from '../api/authService';

type SignInPayload = { email: string; password: string };

export interface AuthContextValue {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoggedIn: boolean;
    login: (payload: SignInPayload) => Promise<User>;
    register: (payload: SignUpRequest) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            setUser,
            isLoggedIn: Boolean(user),
            login,
            register,
            logout,
        }),
        [user, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return ctx;
};

export default AuthProvider;

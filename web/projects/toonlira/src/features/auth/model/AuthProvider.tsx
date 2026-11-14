import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { subscribeAuthExpired } from '@shared/service/session';
import { showErrorToast } from '@shared/service/util/toastService';

import { type User } from '@entities/user';

import { getCurrentUser, getStoredSession, mapAuthResponseToUser, signIn, signOut, signUp as signUpService, type SignUpRequest } from '../api/authService';

type SignInPayload = { email: string; password: string };

export interface AuthContextValue {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoggedIn: boolean;
    /** True enquanto a sessão persistida ainda está sendo validada no mount —
     *  guards devem segurar a renderização de conteúdo protegido até resolver. */
    isInitializing: boolean;
    login: (payload: SignInPayload) => Promise<User>;
    register: (payload: SignUpRequest) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { t } = useTranslation('auth');

    const [user, setUser] = useState<User | null>(null);
    // Só há o que validar se existe sessão persistida (senão é anônimo).
    const [isInitializing, setIsInitializing] = useState<boolean>(() => Boolean(getStoredSession()));

    useEffect(() => {
        const session = getStoredSession();

        if (!session) return;

        // Pós-reload o access token de memória não existe: o interceptor faz
        // o refresh silencioso via cookie httpOnly dentro deste /me.
        getCurrentUser()
            .then(auth => {
                if (auth) setUser(mapAuthResponseToUser(auth));
                else setUser(null);
            })
            .catch(() => setUser(null))
            .finally(() => setIsInitializing(false));
    }, []);

    useEffect(() => {
        // Interceptor esgotou o refresh (sessão realmente expirada):
        // derruba o estado global — guards redirecionam para o login.
        const unsubscribe = subscribeAuthExpired(() => {
            setUser(null);

            showErrorToast(t('sessionExpired'), { toastId: 'session-expired' });
        });

        return unsubscribe;
    }, [t]);

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
            isInitializing,
            login,
            register,
            logout,
        }),
        [user, isInitializing, login, register, logout],
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

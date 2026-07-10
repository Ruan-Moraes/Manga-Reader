import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { showErrorToast } from '@shared/service/util/toastService';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL.ts';
import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';

import { type UserRole } from '@entities/user';

import { useAuthContext } from '../model/AuthProvider';

/**
 * Guards baseados no estado global de auth (context), não em leitura direta
 * do localStorage: quando o interceptor derruba a sessão (authExpired), o
 * user vira null e o redirect acontece na hora. Enquanto `isInitializing`,
 * nada é renderizado — evita flash de conteúdo protegido seguido de erro.
 */

/** Redirects to login when unauthenticated, remembering the target path. */
export const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { t } = useTranslation('common');

    const { isLoggedIn, isInitializing } = useAuthContext();

    const location = useLocation();

    useEffect(() => {
        if (!isInitializing && !isLoggedIn) {
            localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, location.pathname);

            showErrorToast(t('guard.authRequired'), { toastId: 'auth-error' });
        }
    }, [isInitializing, isLoggedIn, location, t]);

    if (isInitializing) {
        return null;
    }

    if (!isLoggedIn) {
        return <Navigate to={`${WEB_BASE_URL}${ROUTES.LOGIN}`} replace />;
    }

    return <>{children}</>;
};

/** Gates children behind the authenticated user's role; redirects otherwise. */
export const RoleGuard = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) => {
    const { t } = useTranslation('common');

    const { user, isInitializing } = useAuthContext();

    if (isInitializing) {
        return null;
    }

    if (!user) {
        return <Navigate to={`${WEB_BASE_URL}${ROUTES.LOGIN}`} replace />;
    }

    if (!allowedRoles.includes(user.role ?? 'user')) {
        showErrorToast(t('guard.dashboardForbidden'), {
            toastId: 'dashboard-role-error',
        });

        return <Navigate to={`${WEB_BASE_URL}/`} replace />;
    }

    return <>{children}</>;
};

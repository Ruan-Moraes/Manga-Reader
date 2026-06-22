import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { showErrorToast } from '@shared/service/util/toastService';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL.ts';
import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';
import { getStoredSession } from '@shared/service/session';

import { type UserRole } from '@entities/user';

import { mapAuthResponseToUser } from '../api/authService';

/** Redirects to login when there is no stored session, remembering the target path. */
export const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { t } = useTranslation('common');

    const session = getStoredSession();
    const isAuthenticated = Boolean(session);

    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, location.pathname);

            showErrorToast(t('guard.authRequired'), { toastId: 'auth-error' });
        }
    }, [isAuthenticated, location, t]);

    if (!isAuthenticated) {
        return <Navigate to={`${WEB_BASE_URL}${ROUTES.LOGIN}`} replace />;
    }

    return <>{children}</>;
};

/** Gates children behind the authenticated user's role; redirects otherwise. */
export const RoleGuard = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) => {
    const { t } = useTranslation('common');

    const session = getStoredSession();

    const role = session ? (mapAuthResponseToUser(session).role ?? 'user') : 'user';

    if (!session) {
        return <Navigate to={`${WEB_BASE_URL}${ROUTES.LOGIN}`} replace />;
    }

    if (!allowedRoles.includes(role)) {
        showErrorToast(t('guard.dashboardForbidden'), {
            toastId: 'dashboard-role-error',
        });

        return <Navigate to={`${WEB_BASE_URL}/`} replace />;
    }

    return <>{children}</>;
};

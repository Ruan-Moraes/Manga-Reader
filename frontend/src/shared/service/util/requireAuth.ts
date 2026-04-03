import { getStoredSession } from '@feature/auth/service/authService';
import { showErrorToast } from '@shared/service/util/toastService';

export const requireAuth = (actionMessage: string): boolean => {
    if (getStoredSession()) return true;

    showErrorToast(`Faça login para ${actionMessage}.`, {
        toastId: `auth-required-${actionMessage}`,
    });

    return false;
};

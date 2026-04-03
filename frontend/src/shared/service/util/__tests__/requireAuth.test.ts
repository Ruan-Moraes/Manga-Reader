import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@feature/auth/service/authService', () => ({
    getStoredSession: vi.fn(),
}));

vi.mock('@shared/service/util/toastService', () => ({
    showErrorToast: vi.fn(),
}));

import { getStoredSession } from '@feature/auth/service/authService';
import { showErrorToast } from '@shared/service/util/toastService';
import { requireAuth } from '../requireAuth';

describe('requireAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve retornar true quando o usuário está autenticado', () => {
        vi.mocked(getStoredSession).mockReturnValue({
            accessToken: 'token',
            refreshToken: 'refresh',
            userId: '1',
            name: 'Test',
            email: 'test@test.com',
            role: 'MEMBER',
        });

        const result = requireAuth('comentar');

        expect(result).toBe(true);
        expect(showErrorToast).not.toHaveBeenCalled();
    });

    it('deve retornar false e mostrar toast quando não autenticado', () => {
        vi.mocked(getStoredSession).mockReturnValue(null);

        const result = requireAuth('comentar');

        expect(result).toBe(false);
        expect(showErrorToast).toHaveBeenCalledWith(
            'Faça login para comentar.',
            { toastId: 'auth-required-comentar' },
        );
    });

    it('deve usar a mensagem da ação no toast', () => {
        vi.mocked(getStoredSession).mockReturnValue(null);

        requireAuth('salvar na biblioteca');

        expect(showErrorToast).toHaveBeenCalledWith(
            'Faça login para salvar na biblioteca.',
            { toastId: 'auth-required-salvar na biblioteca' },
        );
    });
});

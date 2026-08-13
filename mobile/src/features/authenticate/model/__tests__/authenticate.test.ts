import { sessionTransitions, useSessionStore } from '@/src/entities/session';

import { authenticateApi } from '../../api/authenticateApi';
import { clearExpiredSession, loadCurrentUser, restoreSession, signIn, signOut, signUp } from '../authenticate';

jest.mock('@/src/entities/session', () => ({
    sessionTransitions: {
        clear: jest.fn(),
        restore: jest.fn(),
        setUser: jest.fn(),
        start: jest.fn(),
    },
    useSessionStore: { getState: jest.fn() },
}));

jest.mock('../../api/authenticateApi', () => ({
    authenticateApi: {
        getCurrentUser: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
    },
}));

const user = { id: 'user-1', name: 'Reader', email: 'reader@example.com', role: 'MEMBER' as const };
const result = { user, accessToken: 'access', refreshToken: 'refresh' };

describe('MOB-BASE-004/005 authenticate actions', () => {
    beforeEach(() => {
        jest.mocked(useSessionStore.getState).mockReturnValue({ identityEpoch: 3 } as ReturnType<typeof useSessionStore.getState>);
    });

    it('inicia sessão somente depois de sign-in/sign-up bem-sucedidos', async () => {
        jest.mocked(authenticateApi.signIn).mockResolvedValue(result);
        jest.mocked(authenticateApi.signUp).mockResolvedValue(result);

        await signIn({ email: user.email, password: 'secret' });
        await signUp({ name: user.name, email: user.email, password: 'secret' });

        expect(sessionTransitions.start).toHaveBeenNthCalledWith(1, user, { accessToken: 'access', refreshToken: 'refresh' });
        expect(sessionTransitions.start).toHaveBeenNthCalledWith(2, user, { accessToken: 'access', refreshToken: 'refresh' });
    });

    it('restaura e limpa a sessão pelas transições controladas', async () => {
        await restoreSession();
        await clearExpiredSession();

        expect(sessionTransitions.restore).toHaveBeenCalledTimes(1);
        expect(sessionTransitions.clear).toHaveBeenCalledTimes(1);
    });

    it('sempre limpa localmente mesmo quando o logout remoto falha', async () => {
        jest.mocked(authenticateApi.signOut).mockRejectedValue(new Error('offline'));

        await expect(signOut()).rejects.toThrow('offline');
        expect(sessionTransitions.clear).toHaveBeenCalledTimes(1);
    });

    it('descarta usuário de uma identidade anterior', async () => {
        jest.mocked(authenticateApi.getCurrentUser).mockResolvedValue(user);

        await expect(loadCurrentUser(2)).resolves.toBeNull();
        expect(sessionTransitions.setUser).not.toHaveBeenCalled();

        await expect(loadCurrentUser(3)).resolves.toEqual(user);
        expect(sessionTransitions.setUser).toHaveBeenCalledWith(user);
    });
});

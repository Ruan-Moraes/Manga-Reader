import { tokenStorage } from '@/src/shared/api';

import { sessionTransitions, useSessionStore } from '../session';

jest.mock('@/src/shared/api', () => ({
    tokenStorage: {
        clear: jest.fn(),
        getAccess: jest.fn(),
        getRefresh: jest.fn(),
        setTokens: jest.fn(),
    },
}));

const mockedStorage = jest.mocked(tokenStorage);
const user = { id: 'u1', name: 'Reader', email: 'reader@example.com', role: 'MEMBER' as const };
const tokens = { accessToken: 'access', refreshToken: 'refresh' };

describe('MOB-BASE-005 session entity', () => {
    beforeEach(() => {
        useSessionStore.setState({ user: null, tokens: null, isAuthenticated: false, identityEpoch: 0 });
    });

    it('restaura tokens persistidos e avança a identidade', async () => {
        mockedStorage.getAccess.mockResolvedValue(tokens.accessToken);
        mockedStorage.getRefresh.mockResolvedValue(tokens.refreshToken);

        await sessionTransitions.restore();

        expect(useSessionStore.getState()).toMatchObject({ tokens, isAuthenticated: true, identityEpoch: 1 });
    });

    it('inicia e encerra a sessão preservando o contrato de armazenamento', async () => {
        await sessionTransitions.start(user, tokens);
        expect(mockedStorage.setTokens).toHaveBeenCalledWith(tokens.accessToken, tokens.refreshToken);
        expect(useSessionStore.getState()).toMatchObject({ user, tokens, isAuthenticated: true, identityEpoch: 1 });

        await sessionTransitions.clear();
        expect(mockedStorage.clear).toHaveBeenCalled();
        expect(useSessionStore.getState()).toMatchObject({ user: null, tokens: null, isAuthenticated: false, identityEpoch: 2 });
    });

    it('limpa o estado local mesmo quando o armazenamento seguro falha', async () => {
        useSessionStore.setState({ user, tokens, isAuthenticated: true, identityEpoch: 4 });
        mockedStorage.clear.mockRejectedValueOnce(new Error('secure storage unavailable'));

        await expect(sessionTransitions.clear()).rejects.toThrow('secure storage unavailable');

        expect(useSessionStore.getState()).toMatchObject({ user: null, tokens: null, isAuthenticated: false, identityEpoch: 5 });
    });
});

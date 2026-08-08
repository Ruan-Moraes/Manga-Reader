import * as SecureStore from 'expo-secure-store';

import { useSessionStore } from '../sessionStore';

const secureStore = jest.mocked(SecureStore);
const user = { id: 'user-1', name: 'Reader', email: 'reader@example.com', role: 'MEMBER' as const };
const tokens = { accessToken: 'access-1', refreshToken: 'refresh-1' };

describe('MOB-BASE-005 sessionStore', () => {
    beforeEach(() => {
        useSessionStore.setState({ user: null, tokens: null, isAuthenticated: false });
        secureStore.getItemAsync.mockResolvedValue(null);
        secureStore.setItemAsync.mockResolvedValue();
        secureStore.deleteItemAsync.mockResolvedValue();
    });

    it('hidrata autenticação somente quando ambos os tokens existem', async () => {
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? tokens.accessToken : tokens.refreshToken));

        await useSessionStore.getState().hydrate();

        expect(useSessionStore.getState()).toMatchObject({ user: null, tokens, isAuthenticated: true });
    });

    it('não autentica com apenas um token', async () => {
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? tokens.accessToken : null));

        await useSessionStore.getState().hydrate();

        expect(useSessionStore.getState().isAuthenticated).toBe(false);
    });

    it('persiste login e limpa completamente o logout', async () => {
        await useSessionStore.getState().login(user, tokens);
        expect(secureStore.setItemAsync).toHaveBeenCalledWith('mr_access_token', tokens.accessToken);
        expect(secureStore.setItemAsync).toHaveBeenCalledWith('mr_refresh_token', tokens.refreshToken);
        expect(useSessionStore.getState()).toMatchObject({ user, tokens, isAuthenticated: true });

        await useSessionStore.getState().logout();
        expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('mr_access_token');
        expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('mr_refresh_token');
        expect(useSessionStore.getState()).toMatchObject({ user: null, tokens: null, isAuthenticated: false });
    });
});

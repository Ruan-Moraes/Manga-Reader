import { api, tokenStorage } from '@/src/shared/api';

import { authenticateApi } from '../authenticateApi';

jest.mock('@/src/shared/api', () => ({
    api: { get: jest.fn(), post: jest.fn() },
    tokenStorage: { getRefresh: jest.fn() },
}));

const mockedApi = jest.mocked(api);
const mockedTokenStorage = jest.mocked(tokenStorage);

const authResponse = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    userId: 'user-1',
    name: 'Reader',
    email: 'reader@example.com',
    role: 'MEMBER',
    photoUrl: null,
    adultContentPreference: null,
};

describe('MOB-BASE-004 authenticateApi', () => {
    it('mapeia login flat da Core para usuário e tokens', async () => {
        mockedApi.post.mockResolvedValue({ data: { data: authResponse } });

        await expect(authenticateApi.signIn({ email: 'reader@example.com', password: 'secret' })).resolves.toEqual({
            user: {
                id: 'user-1',
                name: 'Reader',
                email: 'reader@example.com',
                role: 'MEMBER',
                photoUrl: undefined,
                adultContentPreference: undefined,
            },
            accessToken: 'access-1',
            refreshToken: 'refresh-1',
        });
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/sign-in', { email: 'reader@example.com', password: 'secret' });
    });

    it('rejeita contrato de autenticação incompleto', async () => {
        mockedApi.post.mockResolvedValue({
            data: {
                data: { ...authResponse, userId: null, role: null, accessToken: null, refreshToken: null },
            },
        });

        await expect(authenticateApi.signUp({ name: 'Reader', email: 'reader@example.com', password: 'password' })).rejects.toThrow(
            'Invalid authentication response',
        );
    });

    it('aceita a identidade de /auth/me sem exigir novos tokens', async () => {
        mockedApi.get.mockResolvedValue({ data: { data: { ...authResponse, accessToken: null, refreshToken: null } } });

        await expect(authenticateApi.getCurrentUser()).resolves.toMatchObject({ id: 'user-1', email: 'reader@example.com', role: 'MEMBER' });
        expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
    });

    it.each([
        ['mensagem legada', { message: 'mensagem legada', expiresInSeconds: null }],
        [
            { message: 'ok', expiresInSeconds: 900 },
            { message: 'ok', expiresInSeconds: 900 },
        ],
    ])('normaliza resposta de recuperação %p', async (data, expected) => {
        mockedApi.post.mockResolvedValue({ data: { data } });

        await expect(authenticateApi.requestPasswordReset('reader@example.com')).resolves.toEqual(expected);
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'reader@example.com' });
    });

    it('tolera falha do logout remoto e envia refresh token no body', async () => {
        mockedTokenStorage.getRefresh.mockResolvedValue('refresh-1');
        mockedApi.post.mockRejectedValue(new Error('offline'));

        await expect(authenticateApi.signOut()).resolves.toBeUndefined();
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-1' });
    });
});

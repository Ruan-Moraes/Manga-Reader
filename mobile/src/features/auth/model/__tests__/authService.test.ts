import { api, tokenStorage } from '@/src/shared/api';

import { authService } from '../authService';

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

describe('MOB-BASE-004 authService', () => {
    it('mapeia login flat da Core para usuário e tokens', async () => {
        mockedApi.post.mockResolvedValue({ data: { data: authResponse } });

        await expect(authService.login({ email: 'reader@example.com', password: 'secret' })).resolves.toEqual({
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

    it('usa o contrato de cadastro e aplica fallbacks do mapper', async () => {
        mockedApi.post.mockResolvedValue({
            data: {
                data: { ...authResponse, userId: null, role: null, accessToken: null, refreshToken: null },
            },
        });

        const result = await authService.register({ name: 'Reader', email: 'reader@example.com', password: 'password' });

        expect(mockedApi.post).toHaveBeenCalledWith('/auth/sign-up', { name: 'Reader', email: 'reader@example.com', password: 'password' });
        expect(result).toMatchObject({ user: { id: '', role: 'MEMBER' }, accessToken: '', refreshToken: '' });
    });

    it.each([
        ['mensagem legada', { message: 'mensagem legada', expiresInSeconds: null }],
        [
            { message: 'ok', expiresInSeconds: 900 },
            { message: 'ok', expiresInSeconds: 900 },
        ],
    ])('normaliza resposta de recuperação %p', async (data, expected) => {
        mockedApi.post.mockResolvedValue({ data: { data } });

        await expect(authService.forgotPassword('reader@example.com')).resolves.toEqual(expected);
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'reader@example.com' });
    });

    it('tolera falha do logout remoto e envia refresh token no body', async () => {
        mockedTokenStorage.getRefresh.mockResolvedValue('refresh-1');
        mockedApi.post.mockRejectedValue(new Error('offline'));

        await expect(authService.logout()).resolves.toBeUndefined();
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-1' });
    });
});

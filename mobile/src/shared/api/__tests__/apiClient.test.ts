import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

import i18n, { DEFAULT_LANGUAGE } from '@/src/shared/i18n';

import { api } from '../apiClient';
import { subscribeAuthExpired } from '../authExpired';

const secureStore = jest.mocked(SecureStore);
const apiMock = new AxiosMockAdapter(api);
const axiosMock = new AxiosMockAdapter(axios);
let storedTokens = new Map<string, string>();

describe('MOB-BASE-003/005 apiClient', () => {
    beforeEach(async () => {
        apiMock.reset();
        axiosMock.reset();
        storedTokens = new Map([
            ['mr_access_token', 'access-1'],
            ['mr_refresh_token', 'refresh-1'],
        ]);
        secureStore.getItemAsync.mockImplementation(async key => storedTokens.get(key) ?? null);
        secureStore.setItemAsync.mockImplementation(async (key, value) => {
            storedTokens.set(key, value);
        });
        secureStore.deleteItemAsync.mockImplementation(async key => {
            storedTokens.delete(key);
        });
        await i18n.changeLanguage('es-ES');
    });

    afterAll(() => {
        apiMock.restore();
        axiosMock.restore();
    });

    afterEach(async () => {
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });

    it('envia access token e idioma corrente em requests', async () => {
        apiMock.onGet('/titles').reply(200, { data: [] });

        await api.get('/titles');

        expect(apiMock.history.get[0].headers?.Authorization).toBe('Bearer access-1');
        expect(apiMock.history.get[0].headers?.['Accept-Language']).toBe('es-ES');
    });

    it('faz um único refresh para 401 concorrentes, rotaciona tokens e repete requests', async () => {
        let releaseRefresh!: () => void;
        const refreshGate = new Promise<void>(resolve => {
            releaseRefresh = resolve;
        });
        let protectedCalls = 0;

        apiMock.onGet('/protected').reply(config => {
            protectedCalls += 1;
            return protectedCalls <= 2 ? [401] : [200, { authorization: config.headers?.Authorization }];
        });
        axiosMock.onPost('http://localhost:8080/api/auth/refresh').reply(async () => {
            await refreshGate;
            return [200, { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }];
        });

        const first = api.get('/protected');
        const second = api.get('/protected');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(axiosMock.history.post).toHaveLength(1);
        releaseRefresh();

        const responses = await Promise.all([first, second]);
        expect(responses.map(response => response.status)).toEqual([200, 200]);
        expect(storedTokens).toMatchObject(
            new Map([
                ['mr_access_token', 'access-2'],
                ['mr_refresh_token', 'refresh-2'],
            ]),
        );
        expect(apiMock.history.get.slice(-2).every(request => request.headers?.Authorization === 'Bearer access-2')).toBe(true);
    });

    it('limpa tokens e notifica expiração quando refresh falha', async () => {
        const listener = jest.fn();
        const unsubscribe = subscribeAuthExpired(listener);
        apiMock.onGet('/protected').replyOnce(401);
        axiosMock.onPost('http://localhost:8080/api/auth/refresh').reply(401);

        await expect(api.get('/protected')).rejects.toBeDefined();

        expect(storedTokens.size).toBe(0);
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });
});

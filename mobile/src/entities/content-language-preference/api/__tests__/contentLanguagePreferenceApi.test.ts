import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import { getMyContentLanguages } from '../../index';

describe('MOB-FEAT-004 content language GET contract', () => {
    const apiMock = new AxiosMockAdapter(api);

    afterEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('usa o endpoint autenticado, aceita cancelamento e normaliza o envelope', async () => {
        apiMock.onGet('/users/me/content-locales').reply(config => {
            expect(config.signal).toBeDefined();
            return [200, { data: { contentLocales: ['en-US', 'fr-FR', 'en-US'] } }];
        });

        await expect(getMyContentLanguages(new AbortController().signal)).resolves.toEqual(['en-US', 'pt-BR']);
        expect(apiMock.history.get).toHaveLength(1);
    });
});

import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import { clearMyTrackedHistory, exportMyData } from '../dataControlsApi';

const apiMock = new AxiosMockAdapter(api);

describe('MOB-FEAT-007 data controls API', () => {
    afterEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('mapeia exportação e limpeza aos endpoints autenticados', async () => {
        apiMock.onGet('/users/me/data-export').reply(200, { account: { id: 'user' } });
        apiMock.onDelete('/users/me/tracked-history').reply(204);

        await expect(exportMyData()).resolves.toEqual({ account: { id: 'user' } });
        await expect(clearMyTrackedHistory()).resolves.toBeUndefined();
        expect(apiMock.history.get).toHaveLength(1);
        expect(apiMock.history.delete).toHaveLength(1);
    });
});

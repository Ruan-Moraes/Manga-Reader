import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import { getMySettings } from '../userSettingsApi';

const apiMock = new AxiosMockAdapter(api);

describe('MOB-FEAT-001 settings query', () => {
    afterAll(() => apiMock.restore());

    it('mapeia GET da Core para o modelo normalizado', async () => {
        apiMock.onGet('/users/me/settings').reply(200, {
            data: { appearance: { theme: 'DARK' }, reader: { gap: 8 }, locale: { timezone: 'UTC' }, accessibility: { highContrast: true } },
        });

        await expect(getMySettings()).resolves.toMatchObject({
            appearance: { theme: 'DARK' },
            reader: { gap: 8 },
            locale: { timezone: 'UTC' },
            accessibility: { highContrast: true },
        });
    });
});

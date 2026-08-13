import AxiosMockAdapter from 'axios-mock-adapter';

import { useContentLanguagesStore } from '@/src/features/manage-content-languages';
import { api } from '@/src/shared/api';
import i18n from '@/src/shared/i18n';

describe('MOB-FEAT-003/AC-010 locale and content preferences', () => {
    const apiMock = new AxiosMockAdapter(api);

    afterAll(() => apiMock.restore());

    it('mantém idioma da UI/header separado da cadeia autenticada mantida pela Core', async () => {
        await i18n.changeLanguage('es-ES');
        useContentLanguagesStore.getState().beginAccount(1, 'es-ES');
        useContentLanguagesStore.getState().hydrate(1, ['en-US', 'pt-BR']);
        apiMock.onGet('/titles').reply(200, { data: [] });

        await api.get('/titles');

        expect(i18n.t('nav.home')).toBe('Inicio');
        expect(useContentLanguagesStore.getState().effective).toEqual(['en-US', 'pt-BR']);
        expect(apiMock.history.get[0].headers?.['Accept-Language']).toBe('es-ES');
        expect(apiMock.history.get[0].headers?.['Content-Language']).toBeUndefined();
        expect(apiMock.history.get[0].params).toBeUndefined();
        await i18n.changeLanguage('pt-BR');
    });
});

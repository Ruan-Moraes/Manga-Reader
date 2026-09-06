import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';

import { useSessionStore } from '@/entities/session';
import { useContentLanguagesStore } from '@/features/manage-content-languages';
import { useSettingsStore } from '@/features/manage-settings';
import { api } from '@/shared/api';

import { ContentLanguagesAccountGate, ContentLanguagesIdentityBoundary } from '../ContentLanguagesAccountGate';

describe('MOB-FEAT-004 ContentLanguagesAccountGate', () => {
    const apiMock = new AxiosMockAdapter(api);
    let queryClient: QueryClient;

    beforeEach(() => {
        apiMock.reset();
        queryClient = new QueryClient();
        useSettingsStore.setState({ language: 'en-US' });
        useSessionStore.setState({ isAuthenticated: false, identityEpoch: 0 });
    });
    afterEach(() => queryClient.clear());
    afterAll(() => apiMock.restore());

    it('mantém guest local, reage ao idioma da UI e nunca chama endpoints privados', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ContentLanguagesAccountGate>
                    <Text>content</Text>
                </ContentLanguagesAccountGate>
            </QueryClientProvider>,
        );

        expect(useContentLanguagesStore.getState()).toMatchObject({ identityEpoch: null, effective: ['en-US', 'pt-BR'] });
        act(() => useSettingsStore.setState({ language: 'pt-BR' }));
        await waitFor(() => expect(useContentLanguagesStore.getState().effective).toEqual(['pt-BR']));
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.patch).toHaveLength(0);
    });

    it('hidrata contas, limpa cache privado antes da troca e remove tudo no logout', async () => {
        queryClient.setQueryData(['titles', 'account-one'], { privateSelection: true });
        apiMock
            .onGet('/users/me/content-locales')
            .replyOnce(200, { data: { contentLocales: ['en-US', 'en-US', 'fr-FR'] } })
            .onGet('/users/me/content-locales')
            .reply(200, { data: { contentLocales: ['es-ES', 'pt-BR'] } });
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 1 });

        render(
            <QueryClientProvider client={queryClient}>
                <ContentLanguagesAccountGate>
                    <Text>content</Text>
                </ContentLanguagesAccountGate>
            </QueryClientProvider>,
        );
        await waitFor(() => expect(useContentLanguagesStore.getState().confirmed).toEqual(['en-US', 'pt-BR']));
        expect(queryClient.getQueryData(['titles', 'account-one'])).toBeUndefined();

        act(() => useSessionStore.setState({ isAuthenticated: true, identityEpoch: 2 }));
        expect(useContentLanguagesStore.getState()).toMatchObject({ identityEpoch: 2, confirmed: null });
        await waitFor(() => expect(useContentLanguagesStore.getState().confirmed).toEqual(['es-ES', 'pt-BR']));

        act(() => useSessionStore.setState({ isAuthenticated: false, identityEpoch: 3 }));
        expect(useContentLanguagesStore.getState()).toMatchObject({ identityEpoch: null, confirmed: null, effective: ['en-US', 'pt-BR'] });
    });

    it('usa fallback temporário isolado e permite retry após falha de leitura', async () => {
        apiMock
            .onGet('/users/me/content-locales')
            .replyOnce(500)
            .onGet('/users/me/content-locales')
            .reply(200, { data: { contentLocales: ['es-ES'] } });
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 4 });

        render(
            <QueryClientProvider client={queryClient}>
                <ContentLanguagesAccountGate>
                    <Text>content</Text>
                </ContentLanguagesAccountGate>
            </QueryClientProvider>,
        );
        await waitFor(() => expect(useContentLanguagesStore.getState().hydrationStatus).toBe('error'));
        expect(useContentLanguagesStore.getState()).toMatchObject({ confirmed: null, effective: ['en-US', 'pt-BR'] });

        useContentLanguagesStore.getState().beginAccount(4, 'en-US');
        const { hydrateContentLanguages } = jest.requireActual('@/features/manage-content-languages') as typeof import('@/features/manage-content-languages');
        await hydrateContentLanguages(4);
        expect(useContentLanguagesStore.getState().confirmed).toEqual(['es-ES', 'pt-BR']);
    });

    it('bloqueia sincronamente a cadeia anterior antes do effect em uma troca de conta', () => {
        useContentLanguagesStore.getState().beginAccount(1, 'en-US');
        useContentLanguagesStore.getState().hydrate(1, ['en-US', 'pt-BR']);

        render(
            <ContentLanguagesIdentityBoundary identityEpoch={2} isAuthenticated>
                <Text>{useContentLanguagesStore.getState().effective.join(',')}</Text>
            </ContentLanguagesIdentityBoundary>,
        );

        expect(screen.queryByText('en-US,pt-BR')).toBeNull();
    });

    it.each(['logout', 'expiração'] as const)('bloqueia sincronamente a cadeia anterior antes do effect em %s', _scenario => {
        useContentLanguagesStore.getState().beginAccount(1, 'en-US');
        useContentLanguagesStore.getState().hydrate(1, ['en-US', 'pt-BR']);

        render(
            <ContentLanguagesIdentityBoundary identityEpoch={2} isAuthenticated={false}>
                <Text>{useContentLanguagesStore.getState().effective.join(',')}</Text>
            </ContentLanguagesIdentityBoundary>,
        );

        expect(screen.queryByText('en-US,pt-BR')).toBeNull();
    });
});

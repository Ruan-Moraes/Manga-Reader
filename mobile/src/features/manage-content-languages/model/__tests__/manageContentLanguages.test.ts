import { QueryClient, QueryObserver } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import {
    moveContentLanguage,
    resetContentLanguagesMutationRuntime,
    retryContentLanguageConsumers,
    retryContentLanguagesUpdate,
    updateContentLanguages,
    useContentLanguagesStore,
} from '../../index';

describe('MOB-FEAT-004 manage content languages', () => {
    const apiMock = new AxiosMockAdapter(api);
    let queryClient: QueryClient;

    beforeEach(() => {
        apiMock.reset();
        resetContentLanguagesMutationRuntime();
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        useContentLanguagesStore.getState().beginAccount(1, 'es-ES');
        useContentLanguagesStore.getState().hydrate(1, ['pt-BR', 'en-US', 'es-ES']);
    });

    afterEach(() => queryClient.clear());

    afterAll(() => apiMock.restore());

    it('envia a cadeia completa na ordem escolhida e adota a resposta normalizada', async () => {
        apiMock.onPatch('/users/me/content-locales').reply(config => {
            expect(config.signal).toBeDefined();
            expect(JSON.parse(config.data as string)).toEqual({ contentLocales: ['en-US', 'pt-BR', 'es-ES'] });
            return [200, { data: { contentLocales: ['en-US', 'pt-BR', 'es-ES', 'en-US', 'fr-FR'] } }];
        });

        await moveContentLanguage(1, 0, queryClient);

        expect(useContentLanguagesStore.getState()).toMatchObject({
            effective: ['en-US', 'pt-BR', 'es-ES'],
            confirmed: ['en-US', 'pt-BR', 'es-ES'],
            pending: null,
            syncStatus: 'idle',
        });
    });

    it('invalida apenas catálogo e UGC e preserva preferência confirmada se uma invalidação falhar', async () => {
        const invalidation = jest
            .spyOn(queryClient, 'invalidateQueries')
            .mockImplementation(filters => (filters?.queryKey?.[0] === 'comments' ? Promise.reject(new Error('comments unavailable')) : Promise.resolve()));
        queryClient.setQueryData(['unrelated-form'], { draft: true });
        apiMock.onPatch('/users/me/content-locales').reply(200, { data: { contentLocales: ['es-ES', 'pt-BR'] } });

        await updateContentLanguages(['es-ES', 'pt-BR'], queryClient);

        expect(invalidation.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([['titles'], ['title'], ['comments'], ['review']]);
        expect(queryClient.getQueryData(['unrelated-form'])).toEqual({ draft: true });
        expect(useContentLanguagesStore.getState()).toMatchObject({
            confirmed: ['es-ES', 'pt-BR'],
            invalidationError: 'comments unavailable',
        });
    });

    it('detecta falha real de consumidor e repete somente a invalidação sem novo PATCH', async () => {
        queryClient.clear();
        queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false, staleTime: Infinity } } });
        let calls = 0;
        const queryKey = ['titles'];
        queryClient.setQueryData(queryKey, ['stale']);
        const observer = new QueryObserver(queryClient, {
            queryKey,
            queryFn: async () => {
                calls += 1;
                if (calls === 1) throw new Error('offline');
                return [];
            },
            staleTime: Infinity,
        });
        const unsubscribe = observer.subscribe(() => undefined);
        apiMock.onPatch('/users/me/content-locales').reply(200, { data: { contentLocales: ['es-ES', 'pt-BR'] } });

        await updateContentLanguages(['es-ES', 'pt-BR'], queryClient);
        expect(useContentLanguagesStore.getState().invalidationError).toBe('offline');

        await expect(retryContentLanguageConsumers(queryClient)).resolves.toBe(true);
        expect(apiMock.history.patch).toHaveLength(1);
        expect(calls).toBe(2);
        expect(queryClient.getQueryData(queryKey)).toEqual([]);
        unsubscribe();
    });

    it('refaz somente invalidações falhas, sem repetir PATCH, e preserva novo erro até um retry bem-sucedido', async () => {
        jest.spyOn(queryClient, 'invalidateQueries').mockImplementation(filters =>
            filters?.queryKey?.[0] === 'comments' ? Promise.reject(new Error('comments unavailable')) : Promise.resolve(),
        );
        apiMock.onPatch('/users/me/content-locales').reply(200, { data: { contentLocales: ['es-ES', 'pt-BR'] } });

        await updateContentLanguages(['es-ES', 'pt-BR'], queryClient);
        const invalidation = jest.spyOn(queryClient, 'invalidateQueries');
        invalidation.mockClear();
        invalidation.mockRejectedValueOnce(new Error('comments still unavailable'));

        await expect(retryContentLanguageConsumers(queryClient)).resolves.toBe(false);
        expect(invalidation.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([['comments']]);
        expect(apiMock.history.patch).toHaveLength(1);
        expect(useContentLanguagesStore.getState()).toMatchObject({
            confirmed: ['es-ES', 'pt-BR'],
            invalidationError: 'comments still unavailable',
            consumerRetrying: false,
        });

        invalidation.mockClear();
        invalidation.mockResolvedValueOnce();
        await expect(retryContentLanguageConsumers(queryClient)).resolves.toBe(true);
        expect(invalidation.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([['comments']]);
        expect(apiMock.history.patch).toHaveLength(1);
        expect(useContentLanguagesStore.getState()).toMatchObject({ invalidationError: null, consumerRetrying: false });
    });

    it.each([
        ['troca de conta', () => useContentLanguagesStore.getState().beginAccount(2, 'es-ES'), 2],
        ['logout', () => useContentLanguagesStore.getState().beginGuest('en-US'), null],
        ['expiração', () => useContentLanguagesStore.getState().beginGuest('pt-BR'), null],
    ] as const)('ignora resultado tardio da invalidação após %s', async (_scenario, transition, expectedIdentity) => {
        let rejectInvalidation!: (error: Error) => void;
        let startedInvalidations = 0;
        let markStarted!: () => void;
        const allStarted = new Promise<void>(resolve => {
            markStarted = resolve;
        });
        const pendingInvalidation = new Promise<void>((_resolve, reject) => {
            rejectInvalidation = reject;
        });
        jest.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {
            startedInvalidations += 1;
            if (startedInvalidations === 4) markStarted();
            return pendingInvalidation;
        });
        apiMock.onPatch('/users/me/content-locales').reply(200, { data: { contentLocales: ['es-ES', 'pt-BR'] } });

        const update = updateContentLanguages(['es-ES', 'pt-BR'], queryClient);
        await allStarted;
        resetContentLanguagesMutationRuntime();
        transition();
        rejectInvalidation(new Error('old account invalidation'));
        await update;

        expect(useContentLanguagesStore.getState()).toMatchObject({ identityEpoch: expectedIdentity, invalidationError: null });
    });

    it('ignora invalidação tardia de uma versão anterior após nova mutação confirmada', async () => {
        let rejectOldInvalidation!: (error: Error) => void;
        let markOldStarted!: () => void;
        let invalidationCalls = 0;
        const oldStarted = new Promise<void>(resolve => {
            markOldStarted = resolve;
        });
        const oldInvalidation = new Promise<void>((_resolve, reject) => {
            rejectOldInvalidation = reject;
        });
        jest.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {
            invalidationCalls += 1;
            if (invalidationCalls <= 4) {
                if (invalidationCalls === 4) markOldStarted();
                return oldInvalidation;
            }
            return Promise.resolve();
        });
        apiMock.onPatch('/users/me/content-locales').reply(config => [200, { data: JSON.parse(config.data as string) }]);

        const oldUpdate = updateContentLanguages(['en-US', 'pt-BR'], queryClient);
        await oldStarted;
        await updateContentLanguages(['es-ES', 'pt-BR'], queryClient);
        rejectOldInvalidation(new Error('stale invalidation'));
        await oldUpdate;

        expect(useContentLanguagesStore.getState()).toMatchObject({
            confirmed: ['es-ES', 'pt-BR'],
            invalidationError: null,
        });
    });

    it('mantém a última ordem pendente após falha e faz retry somente dela', async () => {
        apiMock
            .onPatch('/users/me/content-locales')
            .replyOnce(500)
            .onPatch('/users/me/content-locales')
            .reply(config => [200, { data: JSON.parse(config.data as string) }]);

        await expect(updateContentLanguages(['es-ES', 'en-US', 'pt-BR'], queryClient)).rejects.toBeDefined();
        expect(useContentLanguagesStore.getState()).toMatchObject({
            confirmed: ['pt-BR', 'en-US', 'es-ES'],
            effective: ['es-ES', 'en-US', 'pt-BR'],
            pending: ['es-ES', 'en-US', 'pt-BR'],
            syncStatus: 'error',
        });

        await retryContentLanguagesUpdate(queryClient);
        expect(apiMock.history.patch.map(request => JSON.parse(request.data as string))).toEqual([
            { contentLocales: ['es-ES', 'en-US', 'pt-BR'] },
            { contentLocales: ['es-ES', 'en-US', 'pt-BR'] },
        ]);
        expect(useContentLanguagesStore.getState().confirmed).toEqual(['es-ES', 'en-US', 'pt-BR']);
    });

    it('serializa PATCHes para que o servidor sempre receba a edição mais recente por último', async () => {
        let releaseFirst!: () => void;
        let markFirstStarted!: () => void;
        const firstStarted = new Promise<void>(resolve => {
            markFirstStarted = resolve;
        });
        const firstGate = new Promise<void>(resolve => {
            releaseFirst = resolve;
        });
        apiMock
            .onPatch('/users/me/content-locales')
            .replyOnce(async () => {
                markFirstStarted();
                await firstGate;
                return [200, { data: { contentLocales: ['en-US', 'pt-BR', 'es-ES'] } }];
            })
            .onPatch('/users/me/content-locales')
            .reply(200, { data: { contentLocales: ['es-ES', 'en-US', 'pt-BR'] } });

        const first = updateContentLanguages(['en-US', 'pt-BR', 'es-ES'], queryClient).catch(() => null);
        const second = updateContentLanguages(['es-ES', 'en-US', 'pt-BR'], queryClient);
        await firstStarted;
        expect(apiMock.history.patch).toHaveLength(1);
        releaseFirst();
        await Promise.all([first, second]);

        expect(apiMock.history.patch.map(request => JSON.parse(request.data as string))).toEqual([
            { contentLocales: ['en-US', 'pt-BR', 'es-ES'] },
            { contentLocales: ['es-ES', 'en-US', 'pt-BR'] },
        ]);
        expect(useContentLanguagesStore.getState().confirmed).toEqual(['es-ES', 'en-US', 'pt-BR']);
    });

    it('ignora confirmação pertencente a outra identidade', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        apiMock.onPatch('/users/me/content-locales').reply(async () => {
            await gate;
            return [200, { data: { contentLocales: ['en-US', 'pt-BR'] } }];
        });

        const request = updateContentLanguages(['en-US', 'pt-BR'], queryClient).catch(() => null);
        useContentLanguagesStore.getState().beginAccount(2, 'es-ES');
        release();
        await request;

        expect(useContentLanguagesStore.getState()).toMatchObject({ identityEpoch: 2, confirmed: null, effective: ['es-ES', 'pt-BR'] });
    });
});

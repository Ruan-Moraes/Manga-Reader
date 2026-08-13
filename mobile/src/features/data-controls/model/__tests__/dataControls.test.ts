import * as SecureStore from 'expo-secure-store';
import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { useSessionStore } from '@/src/entities/session';

import {
    clearApplicationCache,
    clearDataControlTemporaries,
    clearTrackedHistory,
    DATA_CONTROL_CONFIRMATIONS,
    dataControlQueryKeys,
    shareAccountExport,
} from '../dataControls';
import { useDataControlsStore } from '../dataControlsStore';

const dependencies = () => ({
    queryClient: {
        clear: jest.fn(),
        invalidateQueries: jest.fn().mockResolvedValue(undefined),
        refetchQueries: jest.fn().mockResolvedValue(undefined),
        removeQueries: jest.fn(),
    },
    images: { clear: jest.fn().mockResolvedValue(undefined) },
    exports: {
        share: jest.fn().mockResolvedValue({ status: 'shared' as const, filename: 'export.json' }),
        clearTemporaryFiles: jest.fn().mockResolvedValue(undefined),
    },
    getExport: jest.fn().mockResolvedValue({ account: 'private' }),
    deleteHistory: jest.fn().mockResolvedValue(undefined),
});

describe('MOB-FEAT-007 data controls', () => {
    it('cancela sem efeitos e expõe alcance por chaves localizáveis', async () => {
        const deps = dependencies();

        await expect(clearApplicationCache(false, deps)).resolves.toBe('cancelled');
        await expect(clearTrackedHistory(true, false, deps)).resolves.toBe('cancelled');
        expect(deps.images.clear).not.toHaveBeenCalled();
        expect(deps.deleteHistory).not.toHaveBeenCalled();
        expect(DATA_CONTROL_CONFIRMATIONS.cache.preservesKeys).toContain('dataControls.cache.session');
        expect(DATA_CONTROL_CONFIRMATIONS.history.bodyKey).toBe('dataControls.history.confirmBody');
    });

    it('limpa somente caches regeneráveis e permite refetch ativo', async () => {
        const deps = dependencies();
        const persisted = new Map([
            ['mr_access_token', 'access-byte-for-byte'],
            ['mr_refresh_token', 'refresh-byte-for-byte'],
            ['mr_settings_guest_v1', '{"version":1,"pending":true}'],
        ]);
        jest.mocked(SecureStore.getItemAsync).mockImplementation(async key => persisted.get(key) ?? null);
        const protectedSession = { isAuthenticated: true, tokens: { accessToken: 'access', refreshToken: 'refresh' } };
        useSessionStore.setState(protectedSession);
        const before = {
            session: useSessionStore.getState().tokens,
        };
        const persistedBefore = await Promise.all([...persisted.keys()].map(key => SecureStore.getItemAsync(key)));

        await expect(clearApplicationCache(true, deps)).resolves.toBe('completed');
        expect(deps.images.clear).toHaveBeenCalledTimes(1);
        expect(deps.exports.clearTemporaryFiles).toHaveBeenCalledTimes(1);
        expect(deps.queryClient.clear).toHaveBeenCalledTimes(1);
        expect(deps.queryClient.refetchQueries).toHaveBeenCalledWith({ type: 'active' });
        expect({
            session: useSessionStore.getState().tokens,
        }).toEqual(before);
        await expect(Promise.all([...persisted.keys()].map(key => SecureStore.getItemAsync(key)))).resolves.toEqual(persistedBefore);
        expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('identifica categorias que falharam sem ocultar a limpeza parcial', async () => {
        const deps = dependencies();
        deps.images.clear.mockRejectedValue(new Error('image cache busy'));
        await expect(clearApplicationCache(true, deps)).rejects.toMatchObject({
            message: 'dataControls.error.cachePartial',
            failedCategories: ['images'],
        });
        expect(deps.exports.clearTemporaryFiles).toHaveBeenCalledTimes(1);
        expect(deps.queryClient.clear).toHaveBeenCalledTimes(1);
    });

    it('distingue falha de reidratação depois da limpeza já concluída', async () => {
        const deps = dependencies();
        deps.queryClient.refetchQueries.mockRejectedValue(new Error('offline'));

        await expect(clearApplicationCache(true, deps)).rejects.toMatchObject({
            message: 'dataControls.error.cachePartial',
            failedCategories: ['queries'],
        });
        expect(deps.images.clear).toHaveBeenCalledTimes(1);
        expect(deps.exports.clearTemporaryFiles).toHaveBeenCalledTimes(1);
        expect(deps.queryClient.clear).toHaveBeenCalledTimes(1);
    });

    it('não chama endpoints privados como guest', async () => {
        const deps = dependencies();

        await expect(shareAccountExport(false, deps)).resolves.toBe('unavailable');
        await expect(clearTrackedHistory(false, true, deps)).resolves.toBe('unavailable');
        expect(deps.getExport).not.toHaveBeenCalled();
        expect(deps.deleteHistory).not.toHaveBeenCalled();
    });

    it('compartilha exportação autenticada sem persistência própria', async () => {
        const deps = dependencies();
        await expect(shareAccountExport(true, deps, new Date('2026-08-08'))).resolves.toBe('completed');
        expect(deps.exports.share).toHaveBeenCalledWith({ account: 'private' }, new Date('2026-08-08'));
    });

    it('expõe limpeza preventiva dos temporários em transições de identidade', async () => {
        const deps = dependencies();
        await clearDataControlTemporaries(deps.exports);
        expect(deps.exports.clearTemporaryFiles).toHaveBeenCalledTimes(1);
    });

    it('invalida dados rastreados e preserva reading-progress', async () => {
        const deps = dependencies();
        await expect(clearTrackedHistory(true, true, deps)).resolves.toBe('completed');

        const invalidated = deps.queryClient.invalidateQueries.mock.calls.map(([filter]) => filter.queryKey[0]);
        expect(invalidated).toEqual(['history', 'read-chapters', 'activities', 'analytics']);
        expect(invalidated).not.toContain('reading-progress');
    });

    it('não repete DELETE quando apenas a invalidação local falha', async () => {
        const deps = dependencies();
        deps.queryClient.invalidateQueries.mockRejectedValueOnce(new Error('cache unavailable'));

        await expect(clearTrackedHistory(true, true, deps)).resolves.toBe('completed');
        expect(deps.deleteHistory).toHaveBeenCalledTimes(1);
        expect(deps.queryClient.refetchQueries).toHaveBeenCalledWith({ queryKey: dataControlQueryKeys.history, type: 'active' }, { throwOnError: true });
        expect(deps.queryClient.removeQueries).not.toHaveBeenCalled();
    });

    it('refaz uma query ativa real antes de considerar remover cache após falha de invalidação', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
        let calls = 0;
        const queryFn = async () => (++calls === 1 ? ['stale'] : []);
        await queryClient.fetchQuery({ queryKey: dataControlQueryKeys.history, queryFn });
        const observer = new QueryObserver(queryClient, { queryKey: dataControlQueryKeys.history, queryFn });
        const unsubscribe = observer.subscribe(() => undefined);
        jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValueOnce(new Error('invalidation failed'));

        await clearTrackedHistory(true, true, { ...dependencies(), queryClient });

        const cached = queryClient.getQueryData(dataControlQueryKeys.history);
        unsubscribe();
        queryClient.clear();
        expect(calls).toBeGreaterThan(1);
        expect(cached).toEqual([]);
    });

    it('remove dados stale quando a recuperação real também falha', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false, staleTime: Infinity } } });
        const queryKey = dataControlQueryKeys.history;
        let calls = 0;
        queryClient.setQueryData(queryKey, ['stale']);
        const observer = new QueryObserver(queryClient, {
            queryKey,
            queryFn: async () => {
                calls += 1;
                throw new Error('offline');
            },
            staleTime: Infinity,
        });
        const unsubscribe = observer.subscribe(() => undefined);

        await clearTrackedHistory(true, true, { ...dependencies(), queryClient });

        const cached = queryClient.getQueryData(queryKey);
        unsubscribe();
        queryClient.clear();
        expect(calls).toBe(2);
        expect(cached).toBeUndefined();
    });

    it('bloqueia concorrência, termina busy e permite retry após falha', async () => {
        let release!: () => void;
        const operation = jest
            .fn()
            .mockRejectedValueOnce(new Error('network'))
            .mockImplementationOnce(() => new Promise<void>(resolve => (release = resolve)));

        await expect(useDataControlsStore.getState().run('export', operation)).resolves.toBe(false);
        expect(useDataControlsStore.getState()).toMatchObject({ busyAction: null, errorKey: 'dataControls.error.export' });

        const retry = useDataControlsStore.getState().run('export', operation);
        const duplicate = await useDataControlsStore.getState().run('history', operation);
        expect(duplicate).toBe(false);
        release();
        await expect(retry).resolves.toBe(true);
        expect(operation).toHaveBeenCalledTimes(2);
        expect(useDataControlsStore.getState().busyAction).toBeNull();
    });
});

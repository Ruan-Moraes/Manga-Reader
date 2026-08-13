import { QueryClient } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';

import { usePrivacySettingsStore } from '@/src/entities/user';
import { api } from '@/src/shared/api';

import {
    changeHistoryVisibility,
    resetPrivacyMutationRuntime,
    retryPrivacyConsumers,
    retryPrivacyUpdate,
    updatePrivacy,
    usePrivacyMutationStore,
} from '../../index';

const serverSettings = {
    commentVisibility: 'PUBLIC',
    viewHistoryVisibility: 'PRIVATE',
    libraryVisibility: 'PUBLIC',
    adultContentPreference: 'BLUR',
    behaviorAnalyticsEnabled: true,
} as const;

const apiMock = new AxiosMockAdapter(api);
let queryClient: QueryClient;

describe('MOB-FEAT-006 update privacy', () => {
    beforeEach(() => {
        apiMock.reset();
        resetPrivacyMutationRuntime();
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        usePrivacySettingsStore.getState().beginIdentity(1);
        usePrivacySettingsStore.getState().hydrate(1, serverSettings);
    });

    afterAll(() => apiMock.restore());

    it('envia somente o patch intencional e adota a resposta normalizada da Core', async () => {
        apiMock.onPatch('/users/me/privacy').reply(config => {
            expect(JSON.parse(config.data as string)).toEqual({ commentVisibility: 'PRIVATE' });
            return [200, { data: { ...serverSettings, commentVisibility: 'PRIVATE', adultContentPreference: 'SHOW' } }];
        });

        await updatePrivacy({ commentVisibility: 'PRIVATE' }, queryClient);

        expect(usePrivacySettingsStore.getState().confirmed).toMatchObject({ commentVisibility: 'PRIVATE', adultContentPreference: 'SHOW' });
    });

    it('cancela entrada em DNT sem request e confirma com analytics desligado', async () => {
        const cancelled = await changeHistoryVisibility('DO_NOT_TRACK', () => false, queryClient);
        expect(cancelled).toBeNull();
        expect(apiMock.history.patch).toHaveLength(0);

        apiMock.onPatch('/users/me/privacy').reply(config => {
            expect(JSON.parse(config.data as string)).toEqual({ viewHistoryVisibility: 'DO_NOT_TRACK', behaviorAnalyticsEnabled: false });
            return [200, { data: { ...serverSettings, viewHistoryVisibility: 'DO_NOT_TRACK', behaviorAnalyticsEnabled: false } }];
        });
        await changeHistoryVisibility('DO_NOT_TRACK', () => true, queryClient);
        expect(usePrivacySettingsStore.getState().current?.behaviorAnalyticsEnabled).toBe(false);
    });

    it('impede analytics em DNT e exige ação separada ao sair', async () => {
        usePrivacySettingsStore.getState().hydrate(1, { ...serverSettings, viewHistoryVisibility: 'DO_NOT_TRACK', behaviorAnalyticsEnabled: false });
        await expect(updatePrivacy({ behaviorAnalyticsEnabled: true }, queryClient)).rejects.toThrow('cannot be enabled');
        await expect(updatePrivacy({ viewHistoryVisibility: 'PUBLIC', behaviorAnalyticsEnabled: true }, queryClient)).rejects.toThrow('separate actions');

        apiMock.onPatch('/users/me/privacy').reply(config => {
            expect(JSON.parse(config.data as string)).toEqual({ viewHistoryVisibility: 'PUBLIC' });
            return [200, { data: { ...serverSettings, viewHistoryVisibility: 'PUBLIC', behaviorAnalyticsEnabled: false } }];
        });
        await changeHistoryVisibility('PUBLIC', () => true, queryClient);
        expect(usePrivacySettingsStore.getState().current?.behaviorAnalyticsEnabled).toBe(false);
    });

    it('restaura a cópia confirmada, preserva retry e não invalida cache após falha', async () => {
        const invalidation = jest.spyOn(queryClient, 'invalidateQueries');
        apiMock
            .onPatch('/users/me/privacy')
            .replyOnce(500)
            .onPatch('/users/me/privacy')
            .reply(200, {
                data: { ...serverSettings, libraryVisibility: 'PRIVATE' },
            });

        await expect(updatePrivacy({ libraryVisibility: 'PRIVATE' }, queryClient)).rejects.toBeDefined();
        expect(usePrivacySettingsStore.getState()).toMatchObject({
            current: serverSettings,
            confirmed: serverSettings,
        });
        expect(usePrivacyMutationStore.getState().failedPatch).toEqual({ libraryVisibility: 'PRIVATE' });
        expect(invalidation).not.toHaveBeenCalled();

        await retryPrivacyUpdate(queryClient);
        expect(apiMock.history.patch).toHaveLength(2);
        expect(usePrivacySettingsStore.getState().current?.libraryVisibility).toBe('PRIVATE');
    });

    it('invalida somente famílias dependentes dos campos confirmados', async () => {
        const invalidation = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
        apiMock.onPatch('/users/me/privacy').reply(200, {
            data: { ...serverSettings, commentVisibility: 'PRIVATE', adultContentPreference: 'HIDE' },
        });

        await updatePrivacy({ commentVisibility: 'PRIVATE', adultContentPreference: 'HIDE' }, queryClient);

        expect(invalidation.mock.calls.map(call => call[0]?.queryKey)).toEqual([
            ['user'],
            ['comments'],
            ['titles'],
            ['title'],
            ['search'],
            ['library'],
            ['feed'],
            ['chapters'],
        ]);
        expect(invalidation.mock.calls.every(call => call[0]?.exact === false)).toBe(true);
    });

    it.each([
        [{ viewHistoryVisibility: 'PUBLIC' as const }, [['user'], ['history'], ['activities']]],
        [{ behaviorAnalyticsEnabled: false }, [['analytics'], ['activities']]],
    ])('invalida exatamente as famílias do patch %j', async (patch, expectedKeys) => {
        const invalidation = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
        apiMock.onPatch('/users/me/privacy').reply(200, { data: { ...serverSettings, ...patch } });

        await updatePrivacy(patch, queryClient);

        expect(invalidation.mock.calls.map(call => call[0]?.queryKey)).toEqual(expectedKeys);
    });

    it('não aplica resposta tardia após troca de identidade', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        apiMock.onPatch('/users/me/privacy').reply(async () => {
            await gate;
            return [200, { data: { ...serverSettings, commentVisibility: 'PRIVATE' } }];
        });

        const request = updatePrivacy({ commentVisibility: 'PRIVATE' }, queryClient);
        usePrivacySettingsStore.getState().beginIdentity(2);
        release();
        await request;

        expect(usePrivacySettingsStore.getState()).toMatchObject({ identityEpoch: 2, current: null, confirmed: null });
    });

    it('mantém mutação confirmada quando apenas a invalidação falha', async () => {
        jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('cache unavailable'));
        apiMock.onPatch('/users/me/privacy').reply(200, { data: { ...serverSettings, libraryVisibility: 'PRIVATE' } });

        await expect(updatePrivacy({ libraryVisibility: 'PRIVATE' }, queryClient)).resolves.toMatchObject({ libraryVisibility: 'PRIVATE' });
        expect(usePrivacySettingsStore.getState()).toMatchObject({ confirmed: { libraryVisibility: 'PRIVATE' } });
        expect(usePrivacyMutationStore.getState().invalidationError).toBe('cache unavailable');

        jest.spyOn(queryClient, 'invalidateQueries').mockRestore();
        const retry = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
        await expect(retryPrivacyConsumers(queryClient)).resolves.toBe(true);
        expect(retry.mock.calls.map(call => call[0]?.queryKey)).toEqual([['user'], ['library']]);
        expect(usePrivacyMutationStore.getState().invalidationError).toBeNull();
    });
});

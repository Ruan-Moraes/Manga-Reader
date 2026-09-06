jest.mock('expo-file-system/legacy', () => ({
    createDownloadResumable: jest.fn(),
    deleteAsync: jest.fn().mockResolvedValue(undefined),
    FileSystemSessionType: { FOREGROUND: 0 },
}));

import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

import { api, createFileDownloadAdapter } from '@/shared/api';
import i18n from '@/shared/i18n';

import { clearMyTrackedHistory, exportMyData } from '../dataControlsApi';

const apiMock = new AxiosMockAdapter(api);
const refreshMock = new AxiosMockAdapter(axios);
const destination = 'file:///cache/export.json';
const downloadAsync = jest.fn();
const cancelAsync = jest.fn();
const success = { uri: destination, status: 200, headers: { 'Content-Type': 'application/json' } };

describe('MOB-FEAT-007 data controls API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const tokens = new Map([
            ['mr_access_token', 'access'],
            ['mr_refresh_token', 'refresh'],
        ]);
        jest.mocked(SecureStore.getItemAsync).mockImplementation(async key => tokens.get(key) ?? null);
        jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key, value) => {
            tokens.set(key, value);
        });
        jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async key => {
            tokens.delete(key);
        });
        downloadAsync.mockReset().mockResolvedValue(success);
        cancelAsync.mockReset().mockResolvedValue(undefined);
        jest.mocked(FileSystem.createDownloadResumable).mockReturnValue({ downloadAsync, cancelAsync } as unknown as FileSystem.DownloadResumable);
    });
    afterEach(() => {
        apiMock.reset();
        refreshMock.reset();
        jest.useRealTimers();
    });
    afterAll(() => {
        apiMock.restore();
        refreshMock.restore();
    });

    it('envia URL, token e idioma ao download nativo e mantém o DELETE', async () => {
        apiMock.onDelete('/users/me/tracked-history').reply(204);
        await expect(exportMyData(destination, new AbortController().signal)).resolves.toBeUndefined();
        await expect(clearMyTrackedHistory()).resolves.toBeUndefined();
        expect(FileSystem.createDownloadResumable).toHaveBeenCalledWith('http://localhost:8080/api/users/me/data-export', destination, {
            headers: expect.objectContaining({ Authorization: 'Bearer access', 'Accept-Language': i18n.language }),
            sessionType: 0,
        });
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.delete).toHaveLength(1);
    });

    it('mantém refresh single-flight e repete downloads com tokens novos', async () => {
        downloadAsync.mockResolvedValueOnce({ ...success, status: 401 }).mockResolvedValueOnce({ ...success, status: 401 });
        refreshMock.onPost('http://localhost:8080/api/auth/refresh').reply(200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
        await Promise.all([exportMyData(destination, new AbortController().signal), exportMyData('file:///cache/second.json', new AbortController().signal)]);
        expect(refreshMock.history.post).toHaveLength(1);
        expect(downloadAsync).toHaveBeenCalledTimes(4);
        expect(
            jest
                .mocked(FileSystem.createDownloadResumable)
                .mock.calls.slice(-2)
                .map(([, , options]) => options?.headers?.Authorization),
        ).toEqual(['Bearer new-access', 'Bearer new-access']);
    });

    it('não retorna nem interpreta conteúdo JSON no JS', async () => {
        const response = await api.get('/users/me/data-export', { adapter: createFileDownloadAdapter(destination) });
        expect(response.data).toBeUndefined();
        expect(response.status).toBe(200);
        expect(downloadAsync).toHaveBeenCalledTimes(1);
    });

    it.each([403, 500])('rejeita HTTP %i sem compartilhar um arquivo de erro', async status => {
        downloadAsync.mockResolvedValue({ ...success, status });
        await expect(exportMyData(destination, new AbortController().signal)).rejects.toMatchObject({
            response: { status },
            config: { url: '/users/me/data-export' },
        });
        expect(refreshMock.history.post).toHaveLength(0);
    });

    it('propaga falha nativa com config para os interceptores', async () => {
        downloadAsync.mockRejectedValue(new Error('disk full'));
        await expect(exportMyData(destination, new AbortController().signal)).rejects.toMatchObject({
            code: 'ERR_NETWORK',
            config: { url: '/users/me/data-export' },
        });
    });

    it('cancela em voo e remove uma conclusão nativa tardia', async () => {
        let finish!: (value: typeof success) => void;
        let start!: () => void;
        const started = new Promise<void>(resolve => {
            start = resolve;
        });
        downloadAsync.mockImplementation(() => {
            start();
            return new Promise(resolve => {
                finish = resolve;
            });
        });
        const controller = new AbortController();
        const request = exportMyData(destination, controller.signal);
        const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
        await started;
        controller.abort();
        await rejected;
        expect(cancelAsync).toHaveBeenCalledTimes(1);
        finish(success);
        await Promise.resolve();
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith(destination, { idempotent: true });
    });

    it('respeita timeout mesmo se o cancelamento nativo não concluir', async () => {
        jest.useFakeTimers();
        downloadAsync.mockReturnValue(new Promise(() => undefined));
        cancelAsync.mockReturnValue(new Promise(() => undefined));
        const request = api.get('/users/me/data-export', { adapter: createFileDownloadAdapter(destination), timeout: 20 });
        const rejected = expect(request).rejects.toMatchObject({ code: 'ECONNABORTED' });
        await jest.advanceTimersByTimeAsync(20);
        await rejected;
        expect(cancelAsync).toHaveBeenCalledTimes(1);
    });

    it('propaga indisponibilidade nativa sem quebrar o interceptor de erros', async () => {
        jest.mocked(FileSystem.createDownloadResumable).mockImplementationOnce(() => {
            throw new Error('unavailable');
        });
        await expect(exportMyData(destination, new AbortController().signal)).rejects.toMatchObject({
            code: 'ERR_NOT_SUPPORT',
            config: { url: '/users/me/data-export' },
        });
    });

    it('não inicia transferência com signal já cancelado', async () => {
        const controller = new AbortController();
        controller.abort();
        await expect(exportMyData(destination, controller.signal)).rejects.toMatchObject({ code: 'ERR_CANCELED' });
        expect(downloadAsync).not.toHaveBeenCalled();
    });
});

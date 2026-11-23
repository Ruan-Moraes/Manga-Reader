import * as FileSystem from 'expo-file-system/legacy';
import axios, { type AxiosAdapter, AxiosError, type AxiosResponse, CanceledError } from 'axios';

// O proprietário do destino deve remover o arquivo também em falhas HTTP.
export const createFileDownloadAdapter =
    (uri: string): AxiosAdapter =>
    async config => {
        if (config.method !== 'get') throw new AxiosError('File download requires GET', AxiosError.ERR_BAD_OPTION_VALUE, config);
        const headers = Object.fromEntries(
            Object.entries(config.headers.toJSON())
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => [key, String(value)]),
        );
        let task: FileSystem.DownloadResumable;
        try {
            task = FileSystem.createDownloadResumable(axios.getUri(config), uri, { headers, sessionType: FileSystem.FileSystemSessionType.FOREGROUND });
        } catch {
            throw new AxiosError('File download unavailable', AxiosError.ERR_NOT_SUPPORT, config);
        }
        let cancellation: AxiosError | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let rejectCancellation!: (error: AxiosError) => void;
        const cancelled = new Promise<never>((_, reject) => {
            rejectCancellation = reject;
        });
        const cancel = (error: AxiosError) => {
            if (cancellation) return;
            cancellation = error;
            void task.cancelAsync().catch(() => undefined);
            rejectCancellation(error);
        };
        const cancelledError = () => {
            const error = new CanceledError('File download cancelled');
            error.config = config;
            return error;
        };
        const onAbort = () => cancel(cancelledError());
        config.signal?.addEventListener?.('abort', onAbort);
        if (config.timeout) timer = setTimeout(() => cancel(new AxiosError('File download timed out', AxiosError.ECONNABORTED, config)), config.timeout);

        try {
            if (config.signal?.aborted) throw cancelledError();
            const download = task.downloadAsync().finally(() => {
                // Uma conclusão nativa tardia não pode recriar o temporário cancelado.
                if (cancellation) void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
            });
            const result = await Promise.race([download, cancelled]);
            if (cancellation) throw cancellation;
            if (!result) throw cancelledError();
            const response: AxiosResponse = { data: undefined, status: result.status, statusText: '', headers: result.headers, config };
            if (config.validateStatus && !config.validateStatus(result.status)) {
                throw new AxiosError(
                    'File download failed',
                    result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
                    config,
                    undefined,
                    response,
                );
            }
            return response;
        } catch (error) {
            if (axios.isAxiosError(error)) throw error;
            throw new AxiosError('File download failed', AxiosError.ERR_NETWORK, config);
        } finally {
            if (timer) clearTimeout(timer);
            config.signal?.removeEventListener?.('abort', onAbort);
        }
    };

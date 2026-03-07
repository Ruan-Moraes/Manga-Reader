import type {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

import { showErrorToast } from '@shared/service/util/toastService';
import { resolveApiErrorMessage } from '@shared/service/util/apiErrorMessages';

import type { ApiErrorResponse, HttpClientConfig } from './httpTypes';

/** Mesma chave usada pelo authService para persistir a sessão. */
const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

const onRequest = (
    config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);

        if (raw) {
            const parsed = JSON.parse(raw);
            const token: string | undefined =
                parsed?.accessToken ?? parsed?.token;

            if (token) {
                config.headers.set('Authorization', `Bearer ${token}`);
            }
        }
    } catch {
        // Se o parse falhar, segue sem token.
    }

    return config;
};

/**
 * O backend já retorna `ApiResponse<T>` — o interceptor apenas repassa
 * `response` intacto. Assim, `response.data` já é o `ApiResponse<T>`.
 */
const onResponseSuccess = (response: AxiosResponse): AxiosResponse => response;

// ---------------------------------------------------------------------------
// Error interceptor — trata erros HTTP, de rede e códigos da API
// ---------------------------------------------------------------------------

/** Shape que o backend envia no body de erros. */
type ServerErrorBody = {
    success?: boolean;
    code?: string;
    message?: string;
    statusCode?: number;
    fieldErrors?: Record<string, string>;
};

const createOnResponseError =
    (clientConfig: HttpClientConfig) =>
    (error: AxiosError<ServerErrorBody>): Promise<never> => {
        const status = error.response?.status ?? 0;
        const body = error.response?.data;

        // Extrai code e fieldErrors que o backend retorna
        const code = body?.code;
        const fieldErrors = body?.fieldErrors;

        // Mensagem: prefere mapeamento por código, depois a mensagem do servidor
        let message = resolveApiErrorMessage(code, status, body?.message);

        if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
            message = resolveApiErrorMessage(undefined, 408);
        }

        if (!error.response) {
            message = resolveApiErrorMessage(undefined, 0);
        }

        // 401 → limpa sessão local (token expirado / inválido)
        if (status === 401) {
            try {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            } catch {
                // Silencia erros do storage.
            }
        }

        // Toast automático (desabilitável via config)
        if (!clientConfig.silentErrors) {
            showErrorToast(message, {
                toastId: `http-error-${code || status || 'network'}`,
            });
        }

        const apiError: ApiErrorResponse = {
            success: false,
            code,
            message,
            statusCode: status,
            fieldErrors,
            rawData: body,
        };

        return Promise.reject(apiError);
    };

// ---------------------------------------------------------------------------
// Registra todos os interceptors numa instância Axios
// ---------------------------------------------------------------------------
export const registerInterceptors = (
    instance: AxiosInstance,
    config: HttpClientConfig,
): void => {
    if (!config.skipAuth) {
        instance.interceptors.request.use(onRequest);
    }

    instance.interceptors.response.use(
        onResponseSuccess,
        createOnResponseError(config),
    );
};

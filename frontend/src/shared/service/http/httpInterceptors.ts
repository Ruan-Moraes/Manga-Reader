import type {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { showErrorToast } from '@shared/service/util/toastService';

import type {
    ApiErrorResponse,
    ApiResponse,
    HttpClientConfig,
} from './httpTypes';

/** Mesma chave usada pelo authService para persistir a sessão. */
const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

const onRequest = (
    config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);

        if (raw) {
            const user = JSON.parse(raw);
            const token: string | undefined = user?.token ?? user?.accessToken;

            if (token) {
                config.headers.set('Authorization', `Bearer ${token}`);
            }
        }
    } catch {
        // Se o parse falhar, segue sem token.
    }

    return config;
};

const onResponseSuccess = (
    response: AxiosResponse,
): AxiosResponse<ApiResponse<unknown>> => {
    const normalized: ApiResponse<unknown> = {
        data: response.data,
        success: true,
        statusCode: response.status,
    };

    return { ...response, data: normalized };
};

// ---------------------------------------------------------------------------
// Error interceptor — trata erros HTTP e de rede
// ---------------------------------------------------------------------------
const buildFriendlyMessage = (status: number): string => {
    let response: string = ERROR_MESSAGES.UNKNOWN_ERROR;

    if (status === 400) {
        response = 'Requisição inválida. Verifique os dados enviados.';
    }

    if (status === 401) {
        response = ERROR_MESSAGES.UNAUTHORIZED_ERROR;
    }

    if (status === 403) {
        response = ERROR_MESSAGES.FORBIDDEN_ERROR;
    }

    if (status === 404) {
        response = 'Recurso não encontrado.';
    }

    if (status === 408) {
        response = ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    if (status === 422) {
        response = 'Os dados enviados são inválidos.';
    }

    if (status === 429) {
        response = 'Muitas requisições. Tente novamente em alguns instantes.';
    }

    if (status >= 500) {
        response = ERROR_MESSAGES.SERVER_ERROR;
    }

    return response;
};

const createOnResponseError =
    (clientConfig: HttpClientConfig) =>
    (error: AxiosError<{ message?: string }>): Promise<never> => {
        const status = error.response?.status ?? 0;
        const serverMessage = error.response?.data?.message;

        let message = serverMessage || buildFriendlyMessage(status);

        if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
            message = ERROR_MESSAGES.TIMEOUT_ERROR;
        }

        if (!error.response) {
            message = ERROR_MESSAGES.NETWORK_ERROR;
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
                toastId: `http-error-${status || 'network'}`,
            });
        }

        const apiError: ApiErrorResponse = {
            success: false,
            message,
            statusCode: status,
            rawData: error.response?.data,
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

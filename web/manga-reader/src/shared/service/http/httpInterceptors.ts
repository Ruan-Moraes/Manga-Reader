import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import i18n from '@/i18n/config';

import { API_URLS } from '@shared/constant/API_URLS';
import { showErrorToast } from '@shared/service/util/toastService';
import { resolveApiErrorMessage } from '@shared/service/util/apiErrorMessages';
import { getAccessToken, setAccessToken, clearAccessToken, clearSession, notifyAuthExpired } from '@shared/service/session';

import type { ApiErrorResponse, HttpClientConfig } from './httpTypes';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
const REFRESH_TIMEOUT_MS = 30_000;

const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Access token vive só em memória — nunca lido de storage.
    const token = getAccessToken();

    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    // i18n — idioma ativo do usuário. Backend usa para resolver LocalizedString
    // e particionar UGC. Vary: Accept-Language no servidor garante cache correto.
    try {
        const lang = i18n.language;

        if (lang) {
            config.headers.set('Accept-Language', lang);
        }
    } catch {
        // Silencia se i18n não inicializou.
    }

    return config;
};

/**
 * O api já retorna `ApiResponse<T>` — o interceptor apenas repassa
 * `response` intacto. Assim, `response.data` já é o `ApiResponse<T>`.
 */
const onResponseSuccess = (response: AxiosResponse): AxiosResponse => response;

/** Shape que o api envia no body de erros. */
type ServerErrorBody = {
    success?: boolean;
    code?: string;
    message?: string;
    statusCode?: number;
    fieldErrors?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Refresh silencioso com fila (espelho do mobile: apiClient.ts)
// ---------------------------------------------------------------------------

type QueuedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

// Estado de módulo (single-flight): N requests com 401 concorrentes
// disparam UM único POST /refresh; as demais aguardam na fila.
let isRefreshing = false;
let refreshQueue: QueuedRequest[] = [];

const resolveRefreshQueue = (token: string) => {
    refreshQueue.forEach(({ resolve }) => resolve(token));
    refreshQueue = [];
};

const rejectRefreshQueue = (error: unknown) => {
    refreshQueue.forEach(({ reject }) => reject(error));
    refreshQueue = [];
};

/** Endpoints de auth nunca disparam refresh — evita loop (o próprio /refresh
 *  retornando 401, sign-in com senha errada, etc.). /me pode: é a rota de
 *  reidratação e se beneficia do refresh silencioso. */
const isAuthEndpointWithoutRetry = (url: string): boolean =>
    url.includes('/api/auth/') && !url.includes('/api/auth/me');

/**
 * Chama o /refresh com axios cru (fora dos interceptors) e sem body:
 * o refresh token vai no cookie httpOnly — o JS nunca o toca.
 */
const performRefresh = async (): Promise<string> => {
    const response = await axios.post(API_URLS.AUTH_REFRESH, undefined, {
        withCredentials: true,
        timeout: REFRESH_TIMEOUT_MS,
    });

    const accessToken: string | undefined = response.data?.data?.accessToken;

    if (!accessToken) {
        throw new Error('Resposta do refresh sem accessToken');
    }

    setAccessToken(accessToken);

    return accessToken;
};

/** Sessão irrecuperável: limpa tudo e avisa o AuthProvider (pub/sub). */
const handleSessionExpired = () => {
    clearAccessToken();

    try {
        clearSession();
    } catch {
        // Silencia erros do storage.
    }

    notifyAuthExpired();
};

const normalizeError = (error: AxiosError<ServerErrorBody>, clientConfig: HttpClientConfig, silent = false): ApiErrorResponse => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    // Extrai code e fieldErrors que o api retorna
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

    // Toast automático (desabilitável via config)
    if (!silent && !clientConfig.silentErrors) {
        showErrorToast(message, {
            toastId: `http-error-${code || status || 'network'}`,
        });
    }

    return {
        success: false,
        code,
        message,
        statusCode: status,
        fieldErrors,
        rawData: body,
    };
};

const createOnResponseError =
    (instance: AxiosInstance, clientConfig: HttpClientConfig) =>
    async (error: AxiosError<ServerErrorBody>): Promise<unknown> => {
        const status = error.response?.status ?? 0;
        const originalRequest = error.config as RetriableConfig | undefined;
        const url = originalRequest?.url ?? '';

        const canAttemptRefresh =
            status === 401 &&
            !clientConfig.skipAuth &&
            originalRequest != null &&
            !originalRequest._retry &&
            !isAuthEndpointWithoutRetry(url);

        if (!canAttemptRefresh) {
            return Promise.reject(normalizeError(error, clientConfig));
        }

        // Já existe um refresh em andamento — entra na fila e repete a
        // request original quando o novo access token chegar.
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: token => {
                        originalRequest._retry = true;
                        originalRequest.headers.set('Authorization', `Bearer ${token}`);
                        resolve(instance(originalRequest));
                    },
                    reject: () => reject(normalizeError(error, clientConfig, true)),
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const token = await performRefresh();

            resolveRefreshQueue(token);

            originalRequest.headers.set('Authorization', `Bearer ${token}`);

            // Retry transparente — o usuário nem percebe que o access expirou.
            return instance(originalRequest);
        } catch (refreshError) {
            rejectRefreshQueue(refreshError);

            handleSessionExpired();

            // Sem toast aqui: o AuthProvider reage ao authExpired com a
            // mensagem de sessão expirada (evita toast duplicado).
            return Promise.reject(normalizeError(error, clientConfig, true));
        } finally {
            isRefreshing = false;
        }
    };

export const registerInterceptors = (instance: AxiosInstance, config: HttpClientConfig): void => {
    if (!config.skipAuth) {
        instance.interceptors.request.use(onRequest);
    }

    instance.interceptors.response.use(onResponseSuccess, createOnResponseError(instance, config));
};

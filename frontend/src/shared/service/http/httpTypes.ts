/**
 * Wrapper padrão de resposta da API.
 *
 * Todas as respostas (sucesso ou erro tratado) são normalizadas para
 * esse formato pelo response interceptor do Axios, garantindo que hooks
 * e componentes sempre consumam a mesma interface.
 */
export type ApiResponse<T> = {
    data: T;
    success: boolean;
    message?: string;
    statusCode?: number;
};

/**
 * Shape de um erro HTTP já tratado pelos interceptors.
 *
 * É o objeto rejeitado na Promise — pode ser capturado tanto por
 * `.catch()` quanto pelo `onError` do React Query.
 */
export type ApiErrorResponse = {
    success: false;
    message: string;
    statusCode: number;
    /** Dados brutos retornados pelo back-end, quando existem. */
    rawData?: unknown;
};

/**
 * Configuração aceita pela factory `createHttpClient`.
 *
 * Permite criar instâncias independentes para APIs diferentes,
 * cada uma com baseURL, timeout e headers próprios.
 */
export type HttpClientConfig = {
    /** URL base da API (ex.: `https://api.mangareader.com/v1`). */
    baseURL?: string;
    /** Timeout em milissegundos. Padrão: 15 000 (15 s). */
    timeout?: number;
    /** Headers adicionais aplicados a todas as requisições. */
    headers?: Record<string, string>;
    /** Se `true`, o interceptor de auth NÃO injeta o token Bearer. */
    skipAuth?: boolean;
    /** Se `true`, erros HTTP NÃO disparam toasts automaticamente. */
    silentErrors?: boolean;
};

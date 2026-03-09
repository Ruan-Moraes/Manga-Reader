/**
 * Wrapper padrão de resposta da API.
 *
 * Shape retornado pelo backend Spring Boot em **todas** as respostas de sucesso.
 * O response interceptor do Axios NÃO re-encapsula — o `data` do Axios já é
 * este objeto, garantindo que hooks e componentes consumam a mesma interface.
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
 *
 * O campo `code` contém o código técnico padronizado da API
 * (ex.: `AUTH_TOKEN_EXPIRED`, `RESOURCE_NOT_FOUND`).
 * O frontend mapeia esses códigos para mensagens amigáveis ao usuário.
 */
export type ApiErrorResponse = {
    success: false;
    /** Código técnico do erro (vem do backend `ApiErrorCode`). */
    code?: string;
    /** Mensagem já amigável, pronta para exibir. */
    message: string;
    statusCode: number;
    /** Erros por campo (presente em erros de validação). */
    fieldErrors?: Record<string, string>;
    /** Dados brutos retornados pelo back-end, quando existem. */
    rawData?: unknown;
};

/**AUTH_ACCESS_DENIED
 * Wrapper para respostas paginadas — espelho do `PageResponse` do backend.
 */
export type PageResponse<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
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
    /** Timeout em milissegundos. Padrão: 30 000 (30 s). */
    timeout?: number;
    /** Headers adicionais aplicados a todas as requisições. */
    headers?: Record<string, string>;
    /** Se `true`, o interceptor de auth NÃO injeta o token Bearer. */
    skipAuth?: boolean;
    /** Se `true`, erros HTTP NÃO disparam toasts automaticamente. */
    silentErrors?: boolean;
};

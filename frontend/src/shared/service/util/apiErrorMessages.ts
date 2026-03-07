/**
 * Mapeamento de códigos de erro da API → mensagens amigáveis ao usuário.
 *
 * O backend retorna códigos técnicos padronizados (campo `code` no body de erro).
 * Este módulo traduz esses códigos em mensagens user-friendly exibidas na interface.
 *
 * Fluxo:
 * 1. Backend lança exceção → GlobalExceptionHandler → `{ code, message, statusCode }`
 * 2. Interceptor Axios captura → chama `resolveApiErrorMessage(code, status, fallback)`
 * 3. Retorna a mensagem mapeada para o código, ou fallback por HTTP status, ou mensagem genérica
 */

// ---------------------------------------------------------------------------
// Códigos técnicos retornados pela API — espelham ApiErrorCode.java
// ---------------------------------------------------------------------------

export const API_ERROR_CODES = {
    // Auth
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_REFRESH_TOKEN_EXPIRED: 'AUTH_REFRESH_TOKEN_EXPIRED',
    AUTH_RESET_TOKEN_INVALID: 'AUTH_RESET_TOKEN_INVALID',
    AUTH_UNAUTHENTICATED: 'AUTH_UNAUTHENTICATED',
    AUTH_ACCESS_DENIED: 'AUTH_ACCESS_DENIED',
    AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',

    // Resource
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_DUPLICATE: 'RESOURCE_DUPLICATE',

    // Validation
    VALIDATION_FIELD_ERROR: 'VALIDATION_FIELD_ERROR',
    VALIDATION_BAD_REQUEST: 'VALIDATION_BAD_REQUEST',
    VALIDATION_TYPE_MISMATCH: 'VALIDATION_TYPE_MISMATCH',

    // Business
    BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',

    // Rate limit
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // Internal
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ApiErrorCodeKey = keyof typeof API_ERROR_CODES;

// ---------------------------------------------------------------------------
// Mensagens amigáveis mapeadas por código
// ---------------------------------------------------------------------------

const ERROR_CODE_MESSAGES: Record<string, string> = {
    // Auth
    [API_ERROR_CODES.AUTH_INVALID_CREDENTIALS]:
        'Email ou senha incorretos. Verifique seus dados e tente novamente.',
    [API_ERROR_CODES.AUTH_TOKEN_EXPIRED]:
        'Sua sessão expirou. Faça login novamente.',
    [API_ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED]:
        'Sua sessão expirou. Faça login novamente.',
    [API_ERROR_CODES.AUTH_RESET_TOKEN_INVALID]:
        'O link de redefinição de senha é inválido ou expirou. Solicite um novo.',
    [API_ERROR_CODES.AUTH_UNAUTHENTICATED]:
        'Você precisa estar logado para acessar este recurso.',
    [API_ERROR_CODES.AUTH_ACCESS_DENIED]:
        'Você não tem permissão para acessar este recurso.',
    [API_ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS]:
        'Este email já está cadastrado. Tente fazer login ou use outro email.',

    // Resource
    [API_ERROR_CODES.RESOURCE_NOT_FOUND]:
        'O item que você procura não foi encontrado.',
    [API_ERROR_CODES.RESOURCE_DUPLICATE]:
        'Este item já existe. Verifique os dados e tente novamente.',

    // Validation
    [API_ERROR_CODES.VALIDATION_FIELD_ERROR]:
        'Alguns campos estão inválidos. Verifique os dados destacados.',
    [API_ERROR_CODES.VALIDATION_BAD_REQUEST]:
        'Requisição inválida. Verifique os dados enviados.',
    [API_ERROR_CODES.VALIDATION_TYPE_MISMATCH]:
        'Requisição inválida. Verifique os dados enviados.',

    // Business
    [API_ERROR_CODES.BUSINESS_RULE_VIOLATION]:
        'Não foi possível completar a ação. Verifique as condições necessárias.',

    // Rate limit
    [API_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
        'Muitas requisições. Aguarde um momento e tente novamente.',

    // Internal
    [API_ERROR_CODES.INTERNAL_SERVER_ERROR]:
        'Erro interno do servidor. Tente novamente mais tarde.',
};

// ---------------------------------------------------------------------------
// Fallback por HTTP status (quando o backend não retorna código)
// ---------------------------------------------------------------------------

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
    0: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    400: 'Requisição inválida. Verifique os dados enviados.',
    401: 'Sua sessão expirou. Faça login novamente.',
    403: 'Você não tem permissão para acessar este recurso.',
    404: 'O item que você procura não foi encontrado.',
    408: 'A requisição demorou demais. Tente novamente mais tarde.',
    409: 'Conflito ao processar a requisição. Tente novamente.',
    422: 'Os dados enviados são inválidos.',
    429: 'Muitas requisições. Aguarde um momento e tente novamente.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    502: 'Servidor temporariamente indisponível. Tente novamente mais tarde.',
    503: 'Servidor temporariamente indisponível. Tente novamente mais tarde.',
};

const DEFAULT_ERROR_MESSAGE =
    'Ops! Ocorreu um erro inesperado. Tente novamente mais tarde.';

// ---------------------------------------------------------------------------
// Resolver principal — usado pelo interceptor
// ---------------------------------------------------------------------------

/**
 * Resolve a mensagem amigável ao usuário a partir do código da API, HTTP status
 * e mensagem fallback do servidor.
 *
 * Prioridade:
 * 1. Mapeamento por `code` (se reconhecido)
 * 2. `serverMessage` (mensagem do backend, se presente)
 * 3. Fallback por `httpStatus`
 * 4. Mensagem genérica
 */
export const resolveApiErrorMessage = (
    code?: string,
    httpStatus?: number,
    serverMessage?: string,
): string => {
    // 1. Mapeamento por código
    if (code && ERROR_CODE_MESSAGES[code]) {
        return ERROR_CODE_MESSAGES[code];
    }

    // 2. Mensagem do servidor
    if (serverMessage) {
        return serverMessage;
    }

    // 3. Fallback por status HTTP
    if (httpStatus !== undefined) {
        if (STATUS_FALLBACK_MESSAGES[httpStatus]) {
            return STATUS_FALLBACK_MESSAGES[httpStatus];
        }

        // Agrupar 5xx
        if (httpStatus >= 500) {
            return STATUS_FALLBACK_MESSAGES[500];
        }
    }

    // 4. Genérico
    return DEFAULT_ERROR_MESSAGE;
};

// ---------------------------------------------------------------------------
// Helpers — para uso direto em componentes quando necessário
// ---------------------------------------------------------------------------

/** Verifica se o código de erro indica que o usuário deve refazer login. */
export const isAuthExpiredError = (code?: string): boolean =>
    code === API_ERROR_CODES.AUTH_TOKEN_EXPIRED ||
    code === API_ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED ||
    code === API_ERROR_CODES.AUTH_UNAUTHENTICATED;

/** Verifica se o erro contém detalhes por campo (validação). */
export const isValidationError = (code?: string): boolean =>
    code === API_ERROR_CODES.VALIDATION_FIELD_ERROR;

// Mensagens de fetch específicas de domínio. Erros HTTP genéricos (network,
// timeout, 401/403/5xx) são resolvidos por apiErrorMessages.ts (resolveApiErrorMessage).
export enum ERROR_MESSAGES {
    INVALID_ID_ERROR = 'O título é inválido. Por favor, verifique a URL e tente novamente.',
    FETCH_ERROR_BASE = 'Ops! Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.',
    FETCH_TITLES_ERROR = 'Ops! Ocorreu um erro ao buscar os títulos.',
    FETCH_COMMENTS_ERROR = 'Ops! Ocorreu um erro ao buscar os comentários.',
}

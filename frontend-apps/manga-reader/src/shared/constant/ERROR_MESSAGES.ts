// Todo: centralizar mensagens de erro comuns, para evitar repetição e garantir consistência.
export enum ERROR_MESSAGES {
    UNKNOWN_ERROR = 'Ops! Ocorreu um erro desconhecido. Tente novamente mais tarde.',
    INVALID_ID_ERROR = 'O título é inválido. Por favor, verifique a URL e tente novamente.',
    FETCH_ERROR_BASE = 'Ops! Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.',
    FETCH_TITLES_ERROR = 'Ops! Ocorreu um erro ao buscar os títulos.',
    FETCH_COMMENTS_ERROR = 'Ops! Ocorreu um erro ao buscar os comentários.',
    NETWORK_ERROR = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    TIMEOUT_ERROR = 'A requisição demorou demais. Tente novamente mais tarde.',
    UNAUTHORIZED_ERROR = 'Sua sessão expirou. Faça login novamente.',
    FORBIDDEN_ERROR = 'Você não tem permissão para acessar este recurso.',
    SERVER_ERROR = 'Erro interno do servidor. Tente novamente mais tarde.',
}

/**
 * Access token mantido apenas em memória (module state).
 *
 * Não vai para localStorage/sessionStorage — XSS não consegue exfiltrar um
 * token que não está em storage. Ao recarregar a página o token se perde e
 * é reobtido via refresh silencioso (cookie httpOnly) no interceptor.
 */
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
    accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

export const clearAccessToken = (): void => {
    accessToken = null;
};

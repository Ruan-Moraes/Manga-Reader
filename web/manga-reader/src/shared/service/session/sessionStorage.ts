export const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

/**
 * Dados não sensíveis do usuário persistidos no localStorage.
 *
 * Tokens NUNCA entram aqui: o access token vive só em memória
 * (`accessTokenMemory`) e o refresh token em cookie httpOnly — nenhum dos
 * dois fica exposto a XSS via storage.
 */
export type StoredSession = {
    userId: string;
    name: string;
    email: string;
    role: string;
    photoUrl?: string;
    adultContentPreference?: 'BLUR' | 'SHOW' | 'HIDE';
};

export const persistSession = (session: StoredSession): void => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getStoredSession = (): StoredSession | null => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);

        return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
        return null;
    }
};

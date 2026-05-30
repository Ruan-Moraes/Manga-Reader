const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

export type StoredSession = {
    accessToken: string;
    refreshToken: string;
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

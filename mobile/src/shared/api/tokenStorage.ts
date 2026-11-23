import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
    TOKENS: 'mr_tokens',
    ACCESS_TOKEN: 'mr_access_token',
    REFRESH_TOKEN: 'mr_refresh_token',
} as const;

interface StoredTokens {
    accessToken: string;
    refreshToken: string;
}

const readTokens = async (): Promise<StoredTokens | null> => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.TOKENS);
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as Partial<StoredTokens>;
            if (typeof parsed.accessToken === 'string' && parsed.accessToken && typeof parsed.refreshToken === 'string' && parsed.refreshToken) {
                return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
            }
        } catch {
            // O fallback legado abaixo permite recuperar sessões anteriores à migração.
        }
    }

    const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
};

export const tokenStorage = {
    getAccess: async () => (await readTokens())?.accessToken ?? null,
    getRefresh: async () => (await readTokens())?.refreshToken ?? null,
    setTokens: async (access: string, refresh: string) => {
        if (!access || !refresh) throw new Error('Invalid authentication tokens');
        await SecureStore.setItemAsync(STORAGE_KEYS.TOKENS, JSON.stringify({ accessToken: access, refreshToken: refresh }));
        await Promise.allSettled([SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN), SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN)]);
    },
    clear: async () => {
        const results = await Promise.allSettled([
            SecureStore.deleteItemAsync(STORAGE_KEYS.TOKENS),
            SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
            SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        ]);
        const failure = results.find(result => result.status === 'rejected');
        if (failure?.status === 'rejected') throw failure.reason;
    },
};

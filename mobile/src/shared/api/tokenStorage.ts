import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'mr_access_token',
    REFRESH_TOKEN: 'mr_refresh_token',
} as const;

export const tokenStorage = {
    getAccess: () => SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    getRefresh: () => SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    setTokens: async (access: string, refresh: string) => {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    },
    clear: async () => {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    },
};

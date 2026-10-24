import * as SecureStore from 'expo-secure-store';

export interface KeyValueStorage {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}

export const secureKeyValueStorage: KeyValueStorage = {
    get: key => SecureStore.getItemAsync(key),
    set: (key, value) => SecureStore.setItemAsync(key, value),
    remove: key => SecureStore.deleteItemAsync(key),
};

export async function readJson<T>(storage: KeyValueStorage, key: string): Promise<T | null> {
    const value = await storage.get(key);

    if (value === null) return null;

    return JSON.parse(value) as T;
}

export async function writeJson(storage: KeyValueStorage, key: string, value: unknown): Promise<void> {
    await storage.set(key, JSON.stringify(value));
}

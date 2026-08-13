import { Image } from 'expo-image';

export interface RegenerableCacheAdapter {
    clear(): Promise<void>;
}

export const imageCache: RegenerableCacheAdapter = {
    clear: async () => {
        const [memoryCleared, diskCleared] = await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
        if (!memoryCleared || !diskCleared) throw new Error('dataControls.error.cache');
    },
};

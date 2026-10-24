jest.mock('expo-image', () => ({
    Image: { clearMemoryCache: jest.fn(), clearDiskCache: jest.fn() },
}));

import { Image } from 'expo-image';

import { imageCache } from '../appCache';

describe('MOB-FEAT-007 image cache', () => {
    it('limpa memória e disco e não simula sucesso parcial', async () => {
        jest.mocked(Image.clearMemoryCache).mockResolvedValue(true);
        jest.mocked(Image.clearDiskCache).mockResolvedValue(true);
        await expect(imageCache.clear()).resolves.toBeUndefined();

        jest.mocked(Image.clearDiskCache).mockResolvedValue(false);
        await expect(imageCache.clear()).rejects.toThrow('dataControls.error.cache');
    });
});

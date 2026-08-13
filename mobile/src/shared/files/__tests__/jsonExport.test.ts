jest.mock('expo-file-system/legacy', () => ({
    cacheDirectory: 'file:///cache/',
    makeDirectoryAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
    getInfoAsync: jest.fn(),
    readDirectoryAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { jsonExport, measureControlledStorage, temporaryExportStorageMeasurement } from '../jsonExport';

describe('MOB-FEAT-007 JSON export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(FileSystem.makeDirectoryAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.writeAsStringAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.deleteAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({ exists: false, isDirectory: false, uri: 'file:///cache/manga-reader-exports/' });
        jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([]);
        jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
        jest.mocked(Sharing.shareAsync).mockResolvedValue(undefined);
    });

    it('compartilha arquivo datado e remove o temporário', async () => {
        await expect(jsonExport.share({ private: 'data' }, new Date('2026-08-08T12:00:00Z'))).resolves.toEqual({
            status: 'shared',
            filename: 'manga-reader-data-export-2026-08-08.json',
        });

        expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
            'file:///cache/manga-reader-exports/manga-reader-data-export-2026-08-08.json',
            JSON.stringify({ private: 'data' }, null, 2),
        );
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.stringContaining('2026-08-08.json'), { idempotent: true });
        expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringContaining('2026-08-08.json'), {
            dialogTitle: 'manga-reader-data-export-2026-08-08.json',
            mimeType: 'application/json',
            UTI: 'public.json',
        });
    });

    it('trata encerramento da share sheet sem erro e remove o temporário', async () => {
        await expect(jsonExport.share({ value: 1 })).resolves.toMatchObject({ status: 'shared' });
        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });

    it('informa indisponibilidade da plataforma e remove o temporário', async () => {
        jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
        await expect(jsonExport.share({ value: 1 })).rejects.toThrow('dataControls.error.exportUnavailable');
        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });

    it('omite medição quando a plataforma não oferece escopo confiável', async () => {
        await expect(measureControlledStorage()).resolves.toBeNull();
    });

    it('expõe bytes e escopo quando um adaptador nativo confiável existe', async () => {
        await expect(measureControlledStorage({ measure: async () => ({ usedBytes: 4096, scope: 'cache do Manga Reader' }) })).resolves.toEqual({
            usedBytes: 4096,
            scope: 'cache do Manga Reader',
        });
    });

    it('mede somente os arquivos temporários controlados pelo app', async () => {
        jest.mocked(FileSystem.getInfoAsync)
            .mockResolvedValueOnce({ exists: true, isDirectory: true, modificationTime: 0, size: 0, uri: 'file:///cache/manga-reader-exports/' })
            .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: 0, size: 1024, uri: 'file:///cache/manga-reader-exports/a.json' })
            .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: 0, size: 2048, uri: 'file:///cache/manga-reader-exports/b.json' });
        jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValue(['a.json', 'b.json']);

        await expect(measureControlledStorage(temporaryExportStorageMeasurement)).resolves.toEqual({
            usedBytes: 3072,
            scope: 'temporary-exports',
        });
    });
});

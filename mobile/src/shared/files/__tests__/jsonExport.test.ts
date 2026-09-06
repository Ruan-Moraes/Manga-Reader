jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'operation') }));
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
        const download = jest.fn().mockResolvedValue(undefined);
        await expect(jsonExport.share(download, new Date('2026-08-08T12:00:00Z'))).resolves.toEqual({
            status: 'shared',
            filename: 'manga-reader-data-export-2026-08-08.json',
        });

        expect(download).toHaveBeenCalledWith('file:///cache/manga-reader-exports/operation/manga-reader-data-export-2026-08-08.json', expect.any(AbortSignal));
        expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///cache/manga-reader-exports/operation/', { idempotent: true });
        expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringContaining('2026-08-08.json'), {
            dialogTitle: 'manga-reader-data-export-2026-08-08.json',
            mimeType: 'application/json',
            UTI: 'public.json',
        });
    });

    it('trata encerramento da share sheet sem erro e remove o temporário', async () => {
        await expect(jsonExport.share(async () => undefined)).resolves.toMatchObject({ status: 'shared' });
        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });

    it('informa indisponibilidade da plataforma e remove o temporário', async () => {
        jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
        await expect(jsonExport.share(async () => undefined)).rejects.toThrow('dataControls.error.exportUnavailable');
        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });

    it('cancela download na troca de identidade antes de remover arquivos ou compartilhar', async () => {
        let started!: () => void;
        const ready = new Promise<void>(resolve => {
            started = resolve;
        });
        const download = jest.fn(
            (_uri: string, signal: AbortSignal) =>
                new Promise<void>((_resolve, reject) => {
                    signal.addEventListener('abort', () => reject(new Error('cancelled')));
                    started();
                }),
        );
        const sharing = jsonExport.share(download);
        await ready;
        await jsonExport.clearTemporaryFiles();
        await expect(sharing).resolves.toMatchObject({ status: 'cancelled' });
        expect(Sharing.shareAsync).not.toHaveBeenCalled();
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///cache/manga-reader-exports/', { idempotent: true });
    });

    it('remove download parcial e permite nova tentativa após falha', async () => {
        await expect(
            jsonExport.share(async () => {
                throw new Error('disk');
            }),
        ).rejects.toThrow('disk');
        expect(Sharing.shareAsync).not.toHaveBeenCalled();
        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
        await expect(jsonExport.share(async () => undefined)).resolves.toMatchObject({ status: 'shared' });
    });

    it('cancela ainda durante a preparação sem começar uma transferência privada', async () => {
        let ready!: () => void;
        jest.mocked(FileSystem.makeDirectoryAsync).mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    ready = () => resolve(undefined);
                }),
        );
        const download = jest.fn().mockResolvedValue(undefined);
        const operation = jsonExport.share(download);
        const cleanup = jsonExport.clearTemporaryFiles();
        ready();
        await cleanup;
        await expect(operation).resolves.toMatchObject({ status: 'cancelled' });
        expect(download).not.toHaveBeenCalled();
        expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('remove o temporário quando o compartilhamento falha', async () => {
        jest.mocked(Sharing.shareAsync).mockRejectedValueOnce(new Error('share unavailable'));
        await expect(jsonExport.share(async () => undefined)).rejects.toThrow('share unavailable');
        expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });

    it('conta arquivos em diretórios isolados sem contar metadados do diretório', async () => {
        jest.mocked(FileSystem.getInfoAsync)
            .mockResolvedValueOnce({ exists: true, isDirectory: true, modificationTime: 0, size: 4096, uri: 'file:///cache/manga-reader-exports/' })
            .mockResolvedValueOnce({ exists: true, isDirectory: true, modificationTime: 0, size: 4096, uri: 'file:///cache/manga-reader-exports/operation' })
            .mockResolvedValueOnce({
                exists: true,
                isDirectory: false,
                modificationTime: 0,
                size: 1024,
                uri: 'file:///cache/manga-reader-exports/operation/data.json',
            });
        jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValueOnce(['operation']).mockResolvedValueOnce(['data.json']);
        await expect(temporaryExportStorageMeasurement.measure()).resolves.toEqual({ usedBytes: 1024, scope: 'temporary-exports' });
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

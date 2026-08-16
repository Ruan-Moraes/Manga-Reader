import * as FileSystem from 'expo-file-system/legacy';

import { appPrivateBatchFiles } from '../privateBatchFiles';

jest.mock('expo-file-system/legacy', () => ({
    documentDirectory: 'file:///documents/',
    copyAsync: jest.fn(),
    deleteAsync: jest.fn(),
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    moveAsync: jest.fn(),
    readDirectoryAsync: jest.fn(),
}));

describe('MOB-FEAT-012 private batch files', () => {
    beforeEach(() => {
        jest.mocked(FileSystem.deleteAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.makeDirectoryAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.copyAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.moveAsync).mockResolvedValue(undefined);
        jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
            exists: true,
            isDirectory: false,
            uri: 'file:///target',
            size: 25,
            modificationTime: 1,
        });
        jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([]);
    });

    it('copies files sequentially without reading base64 and promotes the staging directory', async () => {
        const order: string[] = [];
        jest.mocked(FileSystem.copyAsync).mockImplementation(async ({ from }) => {
            order.push(`start:${from}`);
            order.push(`end:${from}`);
        });

        await expect(
            appPrivateBatchFiles.stageBatch('local-imports', 'draft-1', [
                { sourceUri: 'content://one', filename: 'item-1' },
                { sourceUri: 'content://two', filename: 'item-2' },
            ]),
        ).resolves.toEqual([
            { filename: 'item-1', byteSize: 25 },
            { filename: 'item-2', byteSize: 25 },
        ]);
        expect(order).toEqual(['start:content://one', 'end:content://one', 'start:content://two', 'end:content://two']);

        await appPrivateBatchFiles.promoteBatch('local-imports', 'draft-1');
        expect(FileSystem.moveAsync).toHaveBeenCalledWith({
            from: 'file:///documents/manga-reader-private/local-imports/.staging/draft-1/',
            to: 'file:///documents/manga-reader-private/local-imports/draft-1/',
        });
    });

    it('removes partial staging when a copy fails', async () => {
        jest.mocked(FileSystem.copyAsync).mockRejectedValueOnce(new Error('content://private/path'));

        await expect(appPrivateBatchFiles.stageBatch('local-imports', 'draft-1', [{ sourceUri: 'content://one', filename: 'item-1' }])).rejects.toThrow();
        expect(FileSystem.deleteAsync).toHaveBeenLastCalledWith('file:///documents/manga-reader-private/local-imports/.staging/draft-1/', { idempotent: true });
    });

    it('promotes additions into an existing batch and removes a single private file', async () => {
        await appPrivateBatchFiles.promoteStagedFiles('local-imports', 'add-1', 'draft-1', ['item-3', 'item-4']);

        expect(FileSystem.moveAsync).toHaveBeenNthCalledWith(1, {
            from: 'file:///documents/manga-reader-private/local-imports/.staging/add-1/item-3',
            to: 'file:///documents/manga-reader-private/local-imports/draft-1/item-3',
        });
        expect(FileSystem.moveAsync).toHaveBeenNthCalledWith(2, {
            from: 'file:///documents/manga-reader-private/local-imports/.staging/add-1/item-4',
            to: 'file:///documents/manga-reader-private/local-imports/draft-1/item-4',
        });

        await appPrivateBatchFiles.removeFile('local-imports', 'draft-1', 'item-3');
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///documents/manga-reader-private/local-imports/draft-1/item-3', { idempotent: true });
    });

    it('reconciles staging and batches not referenced by metadata', async () => {
        jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
            exists: true,
            isDirectory: true,
            uri: 'file:///root',
            size: 0,
            modificationTime: 1,
        });
        jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValue(['.staging', 'active', 'orphan']);

        await appPrivateBatchFiles.reconcile('local-imports', new Set(['active']));

        expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///documents/manga-reader-private/local-imports/.staging/', { idempotent: true });
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///documents/manga-reader-private/local-imports/orphan/', { idempotent: true });
        expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith('file:///documents/manga-reader-private/local-imports/active/', expect.anything());
    });

    it('removes orphan files inside an active batch without touching referenced images', async () => {
        jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
            exists: true,
            isDirectory: true,
            uri: 'file:///root',
            size: 0,
            modificationTime: 1,
        });
        jest.mocked(FileSystem.readDirectoryAsync).mockResolvedValue(['item-1', 'item-2', 'orphan']);

        await appPrivateBatchFiles.reconcileBatch('local-imports', 'draft-1', new Set(['item-1', 'item-2']));

        expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///documents/manga-reader-private/local-imports/draft-1/orphan', { idempotent: true });
        expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith('file:///documents/manga-reader-private/local-imports/draft-1/item-1', expect.anything());
    });
});

import { Directory, File } from 'expo-file-system';
import { Image } from 'expo-image';

import type { RenderedTranslationManifest } from '@/entities/local-translation-result';
import { appPrivateBatchFiles, sha256Bytes, sha256File } from '@/shared/files';

import { stageAcquisition } from '../acquisitionFiles';

jest.mock('expo-file-system', () => ({
    Paths: { cache: 'file:///private-cache' },
    Directory: class {
        exists = false;
        uri = 'file:///private-cache/stage';
        create() {
            this.exists = true;
        }
        delete() {
            this.exists = false;
        }
    },
    File: class {
        uri = 'file:///private-cache/stage/file';
        create() {}
        write(_bytes: Uint8Array) {}
    },
}));
jest.mock('@/shared/lib', () => ({ ...jest.requireActual('@/shared/lib'), randomUuid: () => 'test-owned-id' }));
jest.mock('expo-image', () => ({ Image: { loadAsync: jest.fn() } }));
jest.mock('@/shared/files', () => ({
    appPrivateBatchFiles: {
        stageBatch: jest.fn(),
        promoteStagedFiles: jest.fn(),
        discardStaging: jest.fn(),
        removeFile: jest.fn(),
        fileUri: jest.fn(() => 'file:///private/result'),
    },
    sha256Bytes: jest.fn(),
    sha256File: jest.fn(),
}));
const webp = () => {
    const bytes = new Uint8Array(30);
    bytes.set([82, 73, 70, 70, 22, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88]);
    bytes[24] = 9;
    bytes[27] = 19;
    return bytes;
};
const manifest = { image: { widthPx: 10, heightPx: 20, sha256: 'a'.repeat(64) } } as RenderedTranslationManifest;
beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(sha256Bytes).mockResolvedValue('a'.repeat(64));
    jest.mocked(sha256File).mockResolvedValue('a'.repeat(64));
    jest.mocked(Image.loadAsync).mockResolvedValue({ release: jest.fn() } as unknown as Awaited<ReturnType<typeof Image.loadAsync>>);
});
it('stages private bytes, verifies both promoted hashes and native decode before finishing', async () => {
    const stage = await stageAcquisition('project', manifest, webp(), new Uint8Array([123, 125]));
    await stage.promote();
    await stage.validate();
    await stage.finish();
    expect(appPrivateBatchFiles.stageBatch).toHaveBeenCalledWith(
        'translation-results',
        expect.any(String),
        expect.arrayContaining([expect.objectContaining({ filename: stage.renderedFilename })]),
    );
    expect(appPrivateBatchFiles.promoteStagedFiles).toHaveBeenCalledTimes(1);
    expect(sha256File).toHaveBeenCalledTimes(2);
    expect(Image.loadAsync).toHaveBeenCalledWith({ uri: 'file:///private/result' }, { maxWidth: 2048, maxHeight: 2048 });
    expect(appPrivateBatchFiles.removeFile).not.toHaveBeenCalled();
});
it.each(['header', 'animated', 'width', 'height', 'size'])('rejects actual WebP %s mismatch before writing', async point => {
    const bytes = webp();
    if (point === 'header') bytes[0] = 0;
    if (point === 'animated') bytes[20] = 2;
    if (point === 'width') bytes[24] = 10;
    if (point === 'height') bytes[27] = 20;
    if (point === 'size') bytes[4] = 30;
    const write = jest.spyOn(File.prototype, 'write');
    await expect(stageAcquisition('project', manifest, bytes, new Uint8Array([1]))).rejects.toThrow('localTranslation.storageUnavailable');
    expect(write).not.toHaveBeenCalled();
    expect(appPrivateBatchFiles.stageBatch).not.toHaveBeenCalled();
    write.mockRestore();
});
it('cleans cache and staging when device storage rejects a write', async () => {
    const write = jest.spyOn(File.prototype, 'write').mockImplementation(() => {
        throw new Error('private device path');
    });
    const remove = jest.spyOn(Directory.prototype, 'delete');
    await expect(stageAcquisition('project', manifest, webp(), new Uint8Array([1]))).rejects.toThrow('localTranslation.storageUnavailable');
    expect(remove).toHaveBeenCalled();
    expect(appPrivateBatchFiles.discardStaging).toHaveBeenCalled();
    write.mockRestore();
    remove.mockRestore();
});
it('removes only its two filenames after a partial move fails', async () => {
    const stage = await stageAcquisition('project', manifest, webp(), new Uint8Array([1]));
    jest.mocked(appPrivateBatchFiles.promoteStagedFiles).mockRejectedValueOnce(new Error('disk full'));
    await expect(stage.promote()).rejects.toThrow('disk full');
    await stage.discard();
    expect(appPrivateBatchFiles.removeFile).toHaveBeenNthCalledWith(1, 'translation-results', 'project', stage.renderedFilename);
    expect(appPrivateBatchFiles.removeFile).toHaveBeenNthCalledWith(2, 'translation-results', 'project', `${stage.renderedFilename}_manifest`);
});
it.each(['hash', 'decode'])('does not validate a promoted file after %s failure', async point => {
    const stage = await stageAcquisition('project', manifest, webp(), new Uint8Array([1]));
    await stage.promote();
    if (point === 'hash') jest.mocked(sha256File).mockResolvedValueOnce('b'.repeat(64));
    else jest.mocked(Image.loadAsync).mockRejectedValueOnce(new Error('decode failure'));
    await expect(stage.validate()).rejects.toThrow();
    await stage.discard();
    expect(appPrivateBatchFiles.removeFile).toHaveBeenCalledTimes(2);
});

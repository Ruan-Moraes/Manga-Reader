import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';

const DOWNLOAD_TIMEOUT_MS = 60_000;

export interface TemporaryDownload {
    uri: string;
    byteSize: number;
}

export interface TemporaryFiles {
    /** Downloads an already validated HTTPS URL into a new temporary file, never larger than {@code maxBytes}. */
    download(url: string, name: string, maxBytes: number, signal?: AbortSignal): Promise<TemporaryDownload>;
    readBytes(uri: string): Promise<Uint8Array<ArrayBuffer>>;
    remove(uri: string): Promise<void>;
}

function temporaryRoot(): string {
    if (!FileSystem.cacheDirectory) throw new Error('temporaryFiles.unavailable');
    return `${FileSystem.cacheDirectory}toonlira-downloads/`;
}

async function remove(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}

export const appTemporaryFiles: TemporaryFiles = {
    async download(url, name, maxBytes, signal) {
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('temporaryFiles.invalidName');
        const root = temporaryRoot();
        await FileSystem.makeDirectoryAsync(root, { intermediates: true });
        const uri = `${root}${name}`;
        await remove(uri);
        const task = FileSystem.createDownloadResumable(url, uri, { sessionType: FileSystem.FileSystemSessionType.FOREGROUND });
        const abort = () => void task.cancelAsync().catch(() => undefined);
        signal?.addEventListener('abort', abort);
        const timer = setTimeout(abort, DOWNLOAD_TIMEOUT_MS);
        try {
            const result = await task.downloadAsync();
            if (!result || result.status !== 200) throw new Error('temporaryFiles.downloadFailed');
            const info = await FileSystem.getInfoAsync(uri);
            const byteSize = info.exists && !info.isDirectory && typeof info.size === 'number' ? info.size : -1;
            if (byteSize <= 0 || byteSize > maxBytes) throw new Error('temporaryFiles.downloadFailed');
            return { uri, byteSize };
        } catch {
            await remove(uri);
            // A native error may carry the signed URL: never rethrow it.
            throw new Error('temporaryFiles.downloadFailed');
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
        }
    },
    async readBytes(uri) {
        return new File(uri).bytes();
    },
    remove,
};

import * as FileSystem from 'expo-file-system/legacy';

export interface PrivateFileInput {
    sourceUri: string;
    filename: string;
}

export interface StoredPrivateFile {
    filename: string;
    byteSize: number;
}

export interface PrivateBatchFiles {
    stageBatch(namespace: string, batchId: string, files: readonly PrivateFileInput[]): Promise<StoredPrivateFile[]>;
    promoteBatch(namespace: string, batchId: string): Promise<void>;
    promoteStagedFiles(namespace: string, stagingId: string, targetBatchId: string, filenames: readonly string[]): Promise<void>;
    discardStaging(namespace: string, batchId: string): Promise<void>;
    removeFile(namespace: string, batchId: string, filename: string): Promise<void>;
    removeBatch(namespace: string, batchId: string): Promise<void>;
    clearNamespace(namespace: string): Promise<void>;
    reconcile(namespace: string, validBatchIds: ReadonlySet<string>): Promise<void>;
    reconcileBatch(namespace: string, batchId: string, validFilenames: ReadonlySet<string>): Promise<void>;
    fileUri(namespace: string, batchId: string, filename: string): string;
    fileExists(namespace: string, batchId: string, filename: string): Promise<boolean>;
}

function assertSafeSegment(segment: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('privateFiles.invalidSegment');
}

function documentRoot(): string {
    if (!FileSystem.documentDirectory) throw new Error('privateFiles.unavailable');
    return `${FileSystem.documentDirectory}toonlira-private/`;
}

function namespaceRoot(namespace: string): string {
    assertSafeSegment(namespace);
    return `${documentRoot()}${namespace}/`;
}

function stagingUri(namespace: string, batchId: string): string {
    assertSafeSegment(batchId);
    return `${namespaceRoot(namespace)}.staging/${batchId}/`;
}

function batchUri(namespace: string, batchId: string): string {
    assertSafeSegment(batchId);
    return `${namespaceRoot(namespace)}${batchId}/`;
}

function fileUri(namespace: string, batchId: string, filename: string): string {
    assertSafeSegment(filename);
    return `${batchUri(namespace, batchId)}${filename}`;
}

async function safeDelete(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}

export const appPrivateBatchFiles: PrivateBatchFiles = {
    async stageBatch(namespace, batchId, files) {
        const staging = stagingUri(namespace, batchId);
        await safeDelete(staging);
        await FileSystem.makeDirectoryAsync(staging, { intermediates: true });

        const stored: StoredPrivateFile[] = [];
        try {
            for (const file of files) {
                assertSafeSegment(file.filename);
                const destination = `${staging}${file.filename}`;
                await FileSystem.copyAsync({ from: file.sourceUri, to: destination });
                const info = await FileSystem.getInfoAsync(destination);
                if (!info.exists || info.isDirectory) throw new Error('privateFiles.copyFailed');
                stored.push({ filename: file.filename, byteSize: typeof info.size === 'number' ? info.size : 0 });
            }
            return stored;
        } catch (error) {
            await safeDelete(staging);
            throw error;
        }
    },
    async promoteBatch(namespace, batchId) {
        const destination = batchUri(namespace, batchId);
        await safeDelete(destination);
        await FileSystem.moveAsync({ from: stagingUri(namespace, batchId), to: destination });
    },
    async promoteStagedFiles(namespace, stagingId, targetBatchId, filenames) {
        const target = batchUri(namespace, targetBatchId);
        await FileSystem.makeDirectoryAsync(target, { intermediates: true });
        for (const filename of filenames) {
            assertSafeSegment(filename);
            await FileSystem.moveAsync({ from: `${stagingUri(namespace, stagingId)}${filename}`, to: `${target}${filename}` });
        }
        await safeDelete(stagingUri(namespace, stagingId));
    },
    discardStaging(namespace, batchId) {
        return safeDelete(stagingUri(namespace, batchId));
    },
    removeBatch(namespace, batchId) {
        return safeDelete(batchUri(namespace, batchId));
    },
    removeFile(namespace, batchId, filename) {
        return safeDelete(fileUri(namespace, batchId, filename));
    },
    clearNamespace(namespace) {
        return safeDelete(namespaceRoot(namespace));
    },
    async reconcile(namespace, validBatchIds) {
        const root = namespaceRoot(namespace);
        const info = await FileSystem.getInfoAsync(root);
        if (!info.exists) return;

        await safeDelete(`${root}.staging/`);
        const entries = await FileSystem.readDirectoryAsync(root);
        for (const entry of entries) {
            if (entry !== '.staging' && !validBatchIds.has(entry)) await safeDelete(`${root}${entry}/`);
        }
    },
    async reconcileBatch(namespace, batchId, validFilenames) {
        const batch = batchUri(namespace, batchId);
        const info = await FileSystem.getInfoAsync(batch);
        if (!info.exists) return;
        const entries = await FileSystem.readDirectoryAsync(batch);
        for (const entry of entries) {
            if (!validFilenames.has(entry)) await safeDelete(`${batch}${entry}`);
        }
    },
    fileUri,
    async fileExists(namespace, batchId, filename) {
        const info = await FileSystem.getInfoAsync(fileUri(namespace, batchId, filename));
        return info.exists && !info.isDirectory;
    },
};

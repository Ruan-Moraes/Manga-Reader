import { randomUUID } from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const EXPORT_DIRECTORY = `${FileSystem.cacheDirectory ?? ''}toonlira-exports/`;

export interface JsonExportResult {
    status: 'shared' | 'cancelled';
    filename: string;
}

export interface JsonExportAdapter {
    share(download: (uri: string, signal: AbortSignal) => Promise<void>, date?: Date): Promise<JsonExportResult>;
    clearTemporaryFiles(): Promise<void>;
}

const filenameFor = (date: Date): string => `toonlira-data-export-${date.toISOString().slice(0, 10)}.json`;

const activeDownloads = new Map<AbortController, Promise<void>>();

export const jsonExport: JsonExportAdapter = {
    share: async (download, date = new Date()) => {
        if (!FileSystem.cacheDirectory) throw new Error('dataControls.error.exportUnavailable');

        const filename = filenameFor(date);
        const directory = `${EXPORT_DIRECTORY}${randomUUID()}/`;
        const uri = `${directory}${filename}`;
        const controller = new AbortController();
        // Registrar antes de qualquer await: a troca de identidade também cancela a preparação.
        const prepare = (async () => {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            if (!(await Sharing.isAvailableAsync())) throw new Error('dataControls.error.exportUnavailable');
            if (!controller.signal.aborted) await download(uri, controller.signal);
        })();
        activeDownloads.set(controller, prepare);

        try {
            await prepare;
            if (controller.signal.aborted) return { status: 'cancelled', filename };
            await Sharing.shareAsync(uri, { dialogTitle: filename, mimeType: 'application/json', UTI: 'public.json' });
            return { status: 'shared', filename };
        } catch (error) {
            if (controller.signal.aborted) return { status: 'cancelled', filename };
            throw error;
        } finally {
            activeDownloads.delete(controller);
            await FileSystem.deleteAsync(directory, { idempotent: true }).catch(() => undefined);
        }
    },
    clearTemporaryFiles: async () => {
        if (!FileSystem.cacheDirectory) return;
        const downloads = [...activeDownloads.entries()];
        downloads.forEach(([controller]) => controller.abort());
        await Promise.allSettled(downloads.map(([, operation]) => operation));
        await FileSystem.deleteAsync(EXPORT_DIRECTORY, { idempotent: true });
    },
};

export interface StorageMeasurementAdapter {
    measure(): Promise<{ usedBytes: number; scope: string } | null>;
}

export const temporaryExportStorageMeasurement: StorageMeasurementAdapter = {
    measure: async () => {
        if (!FileSystem.cacheDirectory) return null;
        const directory = await FileSystem.getInfoAsync(EXPORT_DIRECTORY);
        if (!directory.exists) return { usedBytes: 0, scope: 'temporary-exports' };
        const entries = await FileSystem.readDirectoryAsync(EXPORT_DIRECTORY);
        const infos = (
            await Promise.all(
                entries.map(async entry => {
                    const uri = `${EXPORT_DIRECTORY}${entry}`;
                    const info = await FileSystem.getInfoAsync(uri);
                    if (!info.exists || !info.isDirectory) return [info];
                    const files = await FileSystem.readDirectoryAsync(uri);
                    return Promise.all(files.map(file => FileSystem.getInfoAsync(`${uri}/${file}`)));
                }),
            )
        ).flat();
        const usedBytes = infos.reduce((total, info) => total + (info.exists && typeof info.size === 'number' ? info.size : 0), 0);
        return { usedBytes, scope: 'temporary-exports' };
    },
};

export const measureControlledStorage = async (adapter?: StorageMeasurementAdapter): Promise<{ usedBytes: number; scope: string } | null> => {
    if (!adapter) return null;
    const measurement = await adapter.measure();
    if (!measurement || measurement.usedBytes < 0 || !measurement.scope.trim()) return null;
    return measurement;
};

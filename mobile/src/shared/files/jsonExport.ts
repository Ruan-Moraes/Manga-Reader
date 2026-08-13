import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const EXPORT_DIRECTORY = `${FileSystem.cacheDirectory ?? ''}manga-reader-exports/`;

export interface JsonExportResult {
    status: 'shared' | 'cancelled';
    filename: string;
}

export interface JsonExportAdapter {
    share(data: unknown, date?: Date): Promise<JsonExportResult>;
    clearTemporaryFiles(): Promise<void>;
}

const filenameFor = (date: Date): string => `manga-reader-data-export-${date.toISOString().slice(0, 10)}.json`;

export const jsonExport: JsonExportAdapter = {
    share: async (data, date = new Date()) => {
        if (!FileSystem.cacheDirectory) throw new Error('dataControls.error.exportUnavailable');

        const filename = filenameFor(date);
        const uri = `${EXPORT_DIRECTORY}${filename}`;
        await FileSystem.makeDirectoryAsync(EXPORT_DIRECTORY, { intermediates: true });

        try {
            await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
            if (!(await Sharing.isAvailableAsync())) throw new Error('dataControls.error.exportUnavailable');
            await Sharing.shareAsync(uri, { dialogTitle: filename, mimeType: 'application/json', UTI: 'public.json' });
            return { status: 'shared', filename };
        } finally {
            await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
        }
    },
    clearTemporaryFiles: async () => {
        if (!FileSystem.cacheDirectory) return;
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
        const infos = await Promise.all(entries.map(entry => FileSystem.getInfoAsync(`${EXPORT_DIRECTORY}${entry}`)));
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

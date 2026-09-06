import type { ImageVariantCapabilities } from '@/entities/chapter';
import { type ImageQuality, normalizeUserSettings, type ReaderSettings, type UserSettings } from '@/entities/user-setting';

export function normalizeReaderSettings(reader: Partial<ReaderSettings>, current: UserSettings): ReaderSettings {
    return normalizeUserSettings({ reader: { ...current.reader, ...reader } }, current).reader;
}

export function selectableQualities(capabilities: ImageVariantCapabilities): readonly ImageQuality[] {
    const qualities: ImageQuality[] = ['AUTO', 'ORIGINAL'];
    if (capabilities.low) qualities.splice(1, 0, 'LOW');
    if (capabilities.medium) qualities.splice(qualities.length - 1, 0, 'MEDIUM');
    if (capabilities.high) qualities.splice(qualities.length - 1, 0, 'HIGH');
    return qualities;
}

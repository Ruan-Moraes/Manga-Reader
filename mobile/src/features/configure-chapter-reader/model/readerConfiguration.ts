import { normalizeUserSettings, type ReaderSettings, type UserSettings } from '@/entities/user-setting';

export function normalizeReaderSettings(reader: Partial<ReaderSettings>, current: UserSettings): ReaderSettings {
    return normalizeUserSettings({ reader: { ...current.reader, ...reader } }, current).reader;
}

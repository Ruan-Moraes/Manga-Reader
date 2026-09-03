import { appPrivateBatchFiles } from '@/src/shared/files';
import {
    advanceAppSchemaVersion,
    type AppDatabase,
    openAppDatabase,
    registerLocalDataParticipant,
    runAppDatabaseMigration,
    type SqlExecutor,
} from '@/src/shared/storage';

import {
    isTranslationLanguageCode,
    isValidTranslationLanguagePair,
    type LocalMediaImportDraft,
    type LocalMediaImportItem,
    type MediaValidationFields,
    type NewLocalMediaImportDraft,
    type TranslationLanguagePair,
} from '../model/localMediaImport';

export const LOCAL_MEDIA_IMPORT_NAMESPACE = 'local-media-imports';

const CURRENT_SCHEMA_VERSION = 6;
const LANGUAGE_CHECK = "'ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR'";
const CREATE_SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS local_media_import_drafts (
    id TEXT PRIMARY KEY NOT NULL,
    slot TEXT NOT NULL UNIQUE CHECK (slot = 'active'),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    confirmed_at INTEGER,
    source_language TEXT NOT NULL DEFAULT 'ja' CHECK (source_language IN (${LANGUAGE_CHECK})),
    target_language TEXT NOT NULL DEFAULT 'pt-BR' CHECK (target_language IN (${LANGUAGE_CHECK})),
    languages_confirmed_at INTEGER,
    CONSTRAINT chk_local_media_import_drafts_language_pair CHECK (source_language <> target_language)
);
CREATE TABLE IF NOT EXISTS local_media_import_items (
    id TEXT PRIMARY KEY NOT NULL,
    draft_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    local_filename TEXT NOT NULL UNIQUE,
    byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
    mime_hint TEXT,
    created_at INTEGER NOT NULL,
    media_validation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (media_validation_status IN ('PENDING', 'VALID', 'INVALID')),
    media_validation_error TEXT CHECK (media_validation_error IN ('MISSING_FILE', 'EMPTY_FILE', 'FILE_CHANGED', 'UNSUPPORTED_FORMAT', 'CORRUPTED', 'DIMENSIONS_UNSAFE')),
    detected_mime_type TEXT CHECK (detected_mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    width_px INTEGER CHECK (width_px > 0),
    height_px INTEGER CHECK (height_px > 0),
    validated_at INTEGER CHECK (validated_at > 0),
    validation_policy_version INTEGER CHECK (validation_policy_version > 0),
    CONSTRAINT fk_local_media_import_items_draft
        FOREIGN KEY (draft_id) REFERENCES local_media_import_drafts(id) ON DELETE CASCADE,
    CONSTRAINT uk_local_media_import_items_position UNIQUE (draft_id, position),
    CONSTRAINT chk_local_media_import_items_validation CHECK (
        (media_validation_status = 'PENDING' AND media_validation_error IS NULL AND detected_mime_type IS NULL AND width_px IS NULL AND height_px IS NULL AND validated_at IS NULL AND validation_policy_version IS NULL)
        OR (media_validation_status = 'VALID' AND media_validation_error IS NULL AND detected_mime_type IS NOT NULL AND width_px IS NOT NULL AND height_px IS NOT NULL AND validated_at IS NOT NULL AND validation_policy_version IS NOT NULL)
        OR (media_validation_status = 'INVALID' AND media_validation_error IS NOT NULL AND validated_at IS NOT NULL AND validation_policy_version IS NOT NULL)
    )
);
`;

interface DraftRow {
    id: string;
    created_at: number;
    updated_at: number;
    confirmed_at?: number | null;
    source_language: string;
    target_language: string;
    languages_confirmed_at: number | null;
}

interface ItemRow {
    id: string;
    position: number;
    local_filename: string;
    byte_size: number;
    mime_hint: string | null;
    created_at: number;
    media_validation_status: LocalMediaImportItem['mediaValidationStatus'];
    media_validation_error: LocalMediaImportItem['mediaValidationError'];
    detected_mime_type: LocalMediaImportItem['detectedMimeType'];
    width_px: number | null;
    height_px: number | null;
    validated_at: number | null;
    validation_policy_version: number | null;
}

interface TableColumnRow {
    name: string;
}

interface TableSqlRow {
    sql: string | null;
}

export type NewLocalMediaImportItem = Omit<LocalMediaImportItem, 'position'>;
export type LocalMediaImportItemReplacement = Pick<NewLocalMediaImportItem, 'localFilename' | 'byteSize' | 'mimeHint' | 'createdAt'>;

export interface RemovedLocalMediaImportItem {
    draft: LocalMediaImportDraft | null;
    filename: string;
}

export interface ReplacedLocalMediaImportItem {
    draft: LocalMediaImportDraft;
    previousFilename: string;
}

export interface LocalMediaImportRepository {
    initialize(): Promise<void>;
    getActive(): Promise<LocalMediaImportDraft | null>;
    replaceActive(draft: NewLocalMediaImportDraft): Promise<string | null>;
    appendItems(draftId: string, items: readonly NewLocalMediaImportItem[], updatedAt: number): Promise<LocalMediaImportDraft>;
    replaceItem(
        draftId: string,
        itemId: string,
        replacement: LocalMediaImportItemReplacement,
        updatedAt: number,
        expectedUpdatedAt: number,
    ): Promise<ReplacedLocalMediaImportItem>;
    removeItem(draftId: string, itemId: string, updatedAt: number): Promise<RemovedLocalMediaImportItem>;
    reorderItems(draftId: string, orderedItemIds: readonly string[], updatedAt: number): Promise<LocalMediaImportDraft>;
    confirm(draftId: string, confirmedAt: number): Promise<LocalMediaImportDraft>;
    updateLanguages(draftId: string, pair: TranslationLanguagePair, updatedAt: number, expectedUpdatedAt: number): Promise<LocalMediaImportDraft>;
    confirmLanguages(draftId: string, confirmedAt: number, expectedUpdatedAt: number): Promise<LocalMediaImportDraft>;
    updateMediaValidation(
        draftId: string,
        itemId: string,
        validation: MediaValidationFields,
        updatedAt: number,
        expectedUpdatedAt: number,
    ): Promise<LocalMediaImportDraft>;
    getReferencedDraftIds(): Promise<Set<string>>;
    measureBytes(): Promise<number>;
    clear(): Promise<void>;
    consumeActive(draftId: string, expectedUpdatedAt: number): Promise<void>;
}

async function migrateDatabase(database: AppDatabase): Promise<void> {
    await database.execAsync(CREATE_SCHEMA);
    let columns = await database.getAllAsync<TableColumnRow>('PRAGMA table_info(local_media_import_drafts)', []);
    if (!columns.some(column => column.name === 'confirmed_at')) {
        await database.execAsync('ALTER TABLE local_media_import_drafts ADD COLUMN confirmed_at INTEGER;');
        columns = await database.getAllAsync<TableColumnRow>('PRAGMA table_info(local_media_import_drafts)', []);
    }
    if (!columns.some(column => column.name === 'source_language')) {
        await database.execAsync('PRAGMA foreign_keys = OFF;');
        try {
            await database.execAsync(`
BEGIN IMMEDIATE;
DROP TABLE IF EXISTS local_media_import_items_v3;
DROP TABLE IF EXISTS local_media_import_drafts_v3;
CREATE TABLE local_media_import_drafts_v3 (
    id TEXT PRIMARY KEY NOT NULL,
    slot TEXT NOT NULL UNIQUE CHECK (slot = 'active'),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    confirmed_at INTEGER,
    source_language TEXT NOT NULL DEFAULT 'ja' CHECK (source_language IN ('ja', 'en', 'es', 'ko', 'zh', 'pt-BR')),
    target_language TEXT NOT NULL DEFAULT 'pt-BR' CHECK (target_language IN ('ja', 'en', 'es', 'ko', 'zh', 'pt-BR')),
    languages_confirmed_at INTEGER,
    CONSTRAINT chk_local_media_import_drafts_language_pair CHECK (source_language <> target_language)
);
CREATE TABLE local_media_import_items_v3 (
    id TEXT PRIMARY KEY NOT NULL,
    draft_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    local_filename TEXT NOT NULL UNIQUE,
    byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
    mime_hint TEXT,
    created_at INTEGER NOT NULL,
    CONSTRAINT fk_local_media_import_items_draft
        FOREIGN KEY (draft_id) REFERENCES local_media_import_drafts_v3(id) ON DELETE CASCADE,
    CONSTRAINT uk_local_media_import_items_position UNIQUE (draft_id, position)
);
INSERT INTO local_media_import_drafts_v3
    (id, slot, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at)
SELECT id, slot, created_at, updated_at, confirmed_at, 'ja', 'pt-BR', NULL
FROM local_media_import_drafts;
INSERT INTO local_media_import_items_v3
    (id, draft_id, position, local_filename, byte_size, mime_hint, created_at)
SELECT id, draft_id, position, local_filename, byte_size, mime_hint, created_at
FROM local_media_import_items;
DROP TABLE local_media_import_items;
DROP TABLE local_media_import_drafts;
ALTER TABLE local_media_import_drafts_v3 RENAME TO local_media_import_drafts;
ALTER TABLE local_media_import_items_v3 RENAME TO local_media_import_items;
COMMIT;
`);
            const violations = await database.getAllAsync<unknown>('PRAGMA foreign_key_check', []);
            if (violations.length > 0) throw new Error('localMediaImport.foreignKeyViolation');
        } catch (error) {
            await database.execAsync('ROLLBACK;').catch(() => undefined);
            throw error;
        } finally {
            await database.execAsync('PRAGMA foreign_keys = ON;');
        }
    }
    const itemColumns = await database.getAllAsync<TableColumnRow>('PRAGMA table_info(local_media_import_items)', []);
    if (!itemColumns.some(column => column.name === 'media_validation_status')) {
        await database.execAsync('PRAGMA foreign_keys = OFF;');
        try {
            await database.execAsync(`
BEGIN IMMEDIATE;
DROP TABLE IF EXISTS local_media_import_items_v4;
CREATE TABLE local_media_import_items_v4 (
    id TEXT PRIMARY KEY NOT NULL,
    draft_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    local_filename TEXT NOT NULL UNIQUE,
    byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
    mime_hint TEXT,
    created_at INTEGER NOT NULL,
    media_validation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (media_validation_status IN ('PENDING', 'VALID', 'INVALID')),
    media_validation_error TEXT CHECK (media_validation_error IN ('MISSING_FILE', 'EMPTY_FILE', 'FILE_CHANGED', 'UNSUPPORTED_FORMAT', 'CORRUPTED', 'DIMENSIONS_UNSAFE')),
    detected_mime_type TEXT CHECK (detected_mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    width_px INTEGER CHECK (width_px > 0),
    height_px INTEGER CHECK (height_px > 0),
    validated_at INTEGER CHECK (validated_at > 0),
    validation_policy_version INTEGER CHECK (validation_policy_version > 0),
    CONSTRAINT fk_local_media_import_items_draft
        FOREIGN KEY (draft_id) REFERENCES local_media_import_drafts(id) ON DELETE CASCADE,
    CONSTRAINT uk_local_media_import_items_position UNIQUE (draft_id, position),
    CONSTRAINT chk_local_media_import_items_validation CHECK (
        (media_validation_status = 'PENDING' AND media_validation_error IS NULL AND detected_mime_type IS NULL AND width_px IS NULL AND height_px IS NULL AND validated_at IS NULL AND validation_policy_version IS NULL)
        OR (media_validation_status = 'VALID' AND media_validation_error IS NULL AND detected_mime_type IS NOT NULL AND width_px IS NOT NULL AND height_px IS NOT NULL AND validated_at IS NOT NULL AND validation_policy_version IS NOT NULL)
        OR (media_validation_status = 'INVALID' AND media_validation_error IS NOT NULL AND validated_at IS NOT NULL AND validation_policy_version IS NOT NULL)
    )
);
INSERT INTO local_media_import_items_v4
    (id, draft_id, position, local_filename, byte_size, mime_hint, created_at)
SELECT id, draft_id, position, local_filename, byte_size, mime_hint, created_at
FROM local_media_import_items;
DROP TABLE local_media_import_items;
ALTER TABLE local_media_import_items_v4 RENAME TO local_media_import_items;
COMMIT;
`);
            const violations = await database.getAllAsync<unknown>('PRAGMA foreign_key_check', []);
            if (violations.length > 0) throw new Error('localMediaImport.foreignKeyViolation');
        } catch (error) {
            await database.execAsync('ROLLBACK;').catch(() => undefined);
            throw error;
        } finally {
            await database.execAsync('PRAGMA foreign_keys = ON;');
        }
    }
    const draftSchema = await database.getFirstAsync<TableSqlRow>(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'local_media_import_drafts' LIMIT 1",
        [],
    );
    if (!draftSchema?.sql?.includes("'zh-Hans'")) {
        await database.execAsync('PRAGMA foreign_keys = OFF;');
        try {
            await database.execAsync(`
BEGIN IMMEDIATE;
DROP TABLE IF EXISTS local_media_import_items_v6;
DROP TABLE IF EXISTS local_media_import_drafts_v6;
CREATE TABLE local_media_import_drafts_v6 (
    id TEXT PRIMARY KEY NOT NULL,
    slot TEXT NOT NULL UNIQUE CHECK (slot = 'active'),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    confirmed_at INTEGER,
    source_language TEXT NOT NULL DEFAULT 'ja' CHECK (source_language IN (${LANGUAGE_CHECK})),
    target_language TEXT NOT NULL DEFAULT 'pt-BR' CHECK (target_language IN (${LANGUAGE_CHECK})),
    languages_confirmed_at INTEGER,
    CONSTRAINT chk_local_media_import_drafts_language_pair CHECK (source_language <> target_language)
);
CREATE TABLE local_media_import_items_v6 (
    id TEXT PRIMARY KEY NOT NULL,
    draft_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    local_filename TEXT NOT NULL UNIQUE,
    byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
    mime_hint TEXT,
    created_at INTEGER NOT NULL,
    media_validation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (media_validation_status IN ('PENDING', 'VALID', 'INVALID')),
    media_validation_error TEXT CHECK (media_validation_error IN ('MISSING_FILE', 'EMPTY_FILE', 'FILE_CHANGED', 'UNSUPPORTED_FORMAT', 'CORRUPTED', 'DIMENSIONS_UNSAFE')),
    detected_mime_type TEXT CHECK (detected_mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    width_px INTEGER CHECK (width_px > 0),
    height_px INTEGER CHECK (height_px > 0),
    validated_at INTEGER CHECK (validated_at > 0),
    validation_policy_version INTEGER CHECK (validation_policy_version > 0),
    CONSTRAINT fk_local_media_import_items_draft
        FOREIGN KEY (draft_id) REFERENCES local_media_import_drafts_v6(id) ON DELETE CASCADE,
    CONSTRAINT uk_local_media_import_items_position UNIQUE (draft_id, position),
    CONSTRAINT chk_local_media_import_items_validation CHECK (
        (media_validation_status = 'PENDING' AND media_validation_error IS NULL AND detected_mime_type IS NULL AND width_px IS NULL AND height_px IS NULL AND validated_at IS NULL AND validation_policy_version IS NULL)
        OR (media_validation_status = 'VALID' AND media_validation_error IS NULL AND detected_mime_type IS NOT NULL AND width_px IS NOT NULL AND height_px IS NOT NULL AND validated_at IS NOT NULL AND validation_policy_version IS NOT NULL)
        OR (media_validation_status = 'INVALID' AND media_validation_error IS NOT NULL AND validated_at IS NOT NULL AND validation_policy_version IS NOT NULL)
    )
);
INSERT INTO local_media_import_drafts_v6
    (id, slot, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at)
SELECT id, slot, created_at, updated_at, confirmed_at,
       CASE source_language WHEN 'zh' THEN 'zh-Hans' ELSE source_language END,
       CASE target_language WHEN 'zh' THEN 'zh-Hans' ELSE target_language END,
       CASE WHEN source_language = 'zh' OR target_language = 'zh' THEN NULL ELSE languages_confirmed_at END
FROM local_media_import_drafts;
INSERT INTO local_media_import_items_v6
    (id, draft_id, position, local_filename, byte_size, mime_hint, created_at,
     media_validation_status, media_validation_error, detected_mime_type,
     width_px, height_px, validated_at, validation_policy_version)
SELECT id, draft_id, position, local_filename, byte_size, mime_hint, created_at,
       media_validation_status, media_validation_error, detected_mime_type,
       width_px, height_px, validated_at, validation_policy_version
FROM local_media_import_items;
DROP TABLE local_media_import_items;
DROP TABLE local_media_import_drafts;
ALTER TABLE local_media_import_drafts_v6 RENAME TO local_media_import_drafts;
ALTER TABLE local_media_import_items_v6 RENAME TO local_media_import_items;
`);
            const violations = await database.getAllAsync<unknown>('PRAGMA foreign_key_check', []);
            if (violations.length > 0) throw new Error('localMediaImport.foreignKeyViolation');
            await database.execAsync('COMMIT;');
        } catch (error) {
            await database.execAsync('ROLLBACK;').catch(() => undefined);
            throw error;
        } finally {
            await database.execAsync('PRAGMA foreign_keys = ON;');
        }
    }
    await advanceAppSchemaVersion(database, CURRENT_SCHEMA_VERSION);
}

async function getDraftFrom(executor: SqlExecutor, draftId?: string): Promise<LocalMediaImportDraft | null> {
    const draft = await executor.getFirstAsync<DraftRow>(
        draftId
            ? "SELECT id, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at FROM local_media_import_drafts WHERE slot = 'active' AND id = ? LIMIT 1"
            : "SELECT id, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at FROM local_media_import_drafts WHERE slot = 'active' LIMIT 1",
        draftId ? [draftId] : [],
    );
    if (!draft) return null;
    if (!isTranslationLanguageCode(draft.source_language) || !isTranslationLanguageCode(draft.target_language)) {
        throw new Error('localMediaImport.invalidLanguageCode');
    }

    const items = await executor.getAllAsync<ItemRow>(
        `SELECT id, position, local_filename, byte_size, mime_hint, created_at,
                media_validation_status, media_validation_error, detected_mime_type,
                width_px, height_px, validated_at, validation_policy_version
         FROM local_media_import_items WHERE draft_id = ? ORDER BY position ASC`,
        [draft.id],
    );
    return {
        id: draft.id,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
        confirmedAt: draft.confirmed_at ?? null,
        sourceLanguage: draft.source_language,
        targetLanguage: draft.target_language,
        languagesConfirmedAt: draft.languages_confirmed_at ?? null,
        items: items.map(mapItem),
    };
}

async function requireDraft(executor: SqlExecutor, draftId: string): Promise<LocalMediaImportDraft> {
    const draft = await getDraftFrom(executor, draftId);
    if (!draft) throw new Error('localMediaImport.draftNotFound');
    return draft;
}

async function persistOrder(executor: SqlExecutor, draftId: string, orderedItemIds: readonly string[]): Promise<void> {
    const offset = orderedItemIds.length + 1;
    await executor.runAsync('UPDATE local_media_import_items SET position = position + ? WHERE draft_id = ?', [offset, draftId]);
    for (const [position, itemId] of orderedItemIds.entries()) {
        await executor.runAsync('UPDATE local_media_import_items SET position = ? WHERE draft_id = ? AND id = ?', [position, draftId, itemId]);
    }
}

export function createSqliteLocalMediaImportRepository(openDatabase: () => Promise<AppDatabase> = openAppDatabase): LocalMediaImportRepository {
    let initialized: Promise<void> | null = null;

    const database = async (): Promise<AppDatabase> => {
        const db = await openDatabase();
        initialized ??= runAppDatabaseMigration(() => migrateDatabase(db)).catch(error => {
            initialized = null;
            throw error;
        });
        await initialized;
        return db;
    };

    return {
        async initialize() {
            await database();
        },
        async getActive() {
            return getDraftFrom(await database());
        },
        async replaceActive(draft) {
            const db = await database();
            let previousId: string | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                previousId =
                    (await transaction.getFirstAsync<{ id: string }>("SELECT id FROM local_media_import_drafts WHERE slot = 'active'", []))?.id ?? null;
                await transaction.runAsync("DELETE FROM local_media_import_drafts WHERE slot = 'active'", []);
                await transaction.runAsync(
                    `INSERT INTO local_media_import_drafts
                     (id, slot, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at)
                     VALUES (?, 'active', ?, ?, ?, ?, ?, ?)`,
                    [draft.id, draft.createdAt, draft.updatedAt, draft.confirmedAt, draft.sourceLanguage, draft.targetLanguage, draft.languagesConfirmedAt],
                );
                for (const item of draft.items) {
                    await transaction.runAsync(
                        `INSERT INTO local_media_import_items
                         (id, draft_id, position, local_filename, byte_size, mime_hint, created_at,
                          media_validation_status, media_validation_error, detected_mime_type,
                          width_px, height_px, validated_at, validation_policy_version)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.id,
                            draft.id,
                            item.position,
                            item.localFilename,
                            item.byteSize,
                            item.mimeHint,
                            item.createdAt,
                            item.mediaValidationStatus,
                            item.mediaValidationError,
                            item.detectedMimeType,
                            item.widthPx,
                            item.heightPx,
                            item.validatedAt,
                            item.validationPolicyVersion,
                        ],
                    );
                }
            });
            return previousId;
        },
        async appendItems(draftId, items, updatedAt) {
            const db = await database();
            let result: LocalMediaImportDraft | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                for (const [index, item] of items.entries()) {
                    await transaction.runAsync(
                        `INSERT INTO local_media_import_items
                         (id, draft_id, position, local_filename, byte_size, mime_hint, created_at,
                          media_validation_status, media_validation_error, detected_mime_type,
                          width_px, height_px, validated_at, validation_policy_version)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.id,
                            draftId,
                            current.items.length + index,
                            item.localFilename,
                            item.byteSize,
                            item.mimeHint,
                            item.createdAt,
                            item.mediaValidationStatus,
                            item.mediaValidationError,
                            item.detectedMimeType,
                            item.widthPx,
                            item.heightPx,
                            item.validatedAt,
                            item.validationPolicyVersion,
                        ],
                    );
                }
                await transaction.runAsync(
                    'UPDATE local_media_import_drafts SET updated_at = ?, confirmed_at = NULL, languages_confirmed_at = NULL WHERE id = ?',
                    [updatedAt, draftId],
                );
                result = await requireDraft(transaction, draftId);
            });
            if (!result) throw new Error('localMediaImport.draftNotFound');
            return result;
        },
        async replaceItem(draftId, itemId, replacement, updatedAt, expectedUpdatedAt) {
            const db = await database();
            let result: ReplacedLocalMediaImportItem | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                if (current.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
                const previous = current.items.find(item => item.id === itemId);
                if (!previous) throw new Error('localMediaImport.itemNotFound');
                await transaction.runAsync(
                    `UPDATE local_media_import_items SET
                        local_filename = ?, byte_size = ?, mime_hint = ?, created_at = ?,
                        media_validation_status = 'PENDING', media_validation_error = NULL, detected_mime_type = NULL,
                        width_px = NULL, height_px = NULL, validated_at = NULL, validation_policy_version = NULL
                     WHERE draft_id = ? AND id = ?`,
                    [replacement.localFilename, replacement.byteSize, replacement.mimeHint, replacement.createdAt, draftId, itemId],
                );
                await transaction.runAsync('UPDATE local_media_import_drafts SET updated_at = ? WHERE id = ?', [updatedAt, draftId]);
                result = { draft: await requireDraft(transaction, draftId), previousFilename: previous.localFilename };
            });
            if (!result) throw new Error('localMediaImport.itemNotFound');
            return result;
        },
        async removeItem(draftId, itemId, updatedAt) {
            const db = await database();
            let result: RemovedLocalMediaImportItem | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                const removed = current.items.find(item => item.id === itemId);
                if (!removed) throw new Error('localMediaImport.itemNotFound');
                await transaction.runAsync('DELETE FROM local_media_import_items WHERE draft_id = ? AND id = ?', [draftId, itemId]);
                const remainingIds = current.items.filter(item => item.id !== itemId).map(item => item.id);
                if (remainingIds.length === 0) {
                    await transaction.runAsync('DELETE FROM local_media_import_drafts WHERE id = ?', [draftId]);
                    result = { draft: null, filename: removed.localFilename };
                    return;
                }
                await persistOrder(transaction, draftId, remainingIds);
                await transaction.runAsync(
                    'UPDATE local_media_import_drafts SET updated_at = ?, confirmed_at = NULL, languages_confirmed_at = NULL WHERE id = ?',
                    [updatedAt, draftId],
                );
                result = { draft: await requireDraft(transaction, draftId), filename: removed.localFilename };
            });
            if (!result) throw new Error('localMediaImport.itemNotFound');
            return result;
        },
        async reorderItems(draftId, orderedItemIds, updatedAt) {
            const db = await database();
            let result: LocalMediaImportDraft | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                const currentIds = new Set(current.items.map(item => item.id));
                if (
                    orderedItemIds.length !== currentIds.size ||
                    new Set(orderedItemIds).size !== currentIds.size ||
                    orderedItemIds.some(id => !currentIds.has(id))
                ) {
                    throw new Error('localMediaImport.invalidOrder');
                }
                await persistOrder(transaction, draftId, orderedItemIds);
                await transaction.runAsync(
                    'UPDATE local_media_import_drafts SET updated_at = ?, confirmed_at = NULL, languages_confirmed_at = NULL WHERE id = ?',
                    [updatedAt, draftId],
                );
                result = await requireDraft(transaction, draftId);
            });
            if (!result) throw new Error('localMediaImport.invalidOrder');
            return result;
        },
        async confirm(draftId, confirmedAt) {
            const db = await database();
            let result: LocalMediaImportDraft | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                if (current.items.length === 0) throw new Error('localMediaImport.emptyDraft');
                await transaction.runAsync('UPDATE local_media_import_drafts SET updated_at = ?, confirmed_at = ? WHERE id = ?', [
                    confirmedAt,
                    confirmedAt,
                    draftId,
                ]);
                result = await requireDraft(transaction, draftId);
            });
            if (!result) throw new Error('localMediaImport.emptyDraft');
            return result;
        },
        async updateLanguages(draftId, pair, updatedAt, expectedUpdatedAt) {
            if (!isValidTranslationLanguagePair(pair)) throw new Error('localMediaImport.invalidLanguagePair');
            const db = await database();
            let result: LocalMediaImportDraft | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                if (current.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
                if (current.items.length === 0 || current.confirmedAt === null) throw new Error('localMediaImport.reviewRequired');
                await transaction.runAsync(
                    `UPDATE local_media_import_drafts
                     SET updated_at = ?, source_language = ?, target_language = ?, languages_confirmed_at = NULL
                     WHERE id = ?`,
                    [updatedAt, pair.sourceLanguage, pair.targetLanguage, draftId],
                );
                result = await requireDraft(transaction, draftId);
            });
            if (!result) throw new Error('localMediaImport.invalidLanguagePair');
            return result;
        },
        async confirmLanguages(draftId, confirmedAt, expectedUpdatedAt) {
            const db = await database();
            let result: LocalMediaImportDraft | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                if (current.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
                if (current.items.length === 0 || current.confirmedAt === null) throw new Error('localMediaImport.reviewRequired');
                if (!isValidTranslationLanguagePair(current)) throw new Error('localMediaImport.invalidLanguagePair');
                await transaction.runAsync('UPDATE local_media_import_drafts SET updated_at = ?, languages_confirmed_at = ? WHERE id = ?', [
                    confirmedAt,
                    confirmedAt,
                    draftId,
                ]);
                result = await requireDraft(transaction, draftId);
            });
            if (!result) throw new Error('localMediaImport.invalidLanguagePair');
            return result;
        },
        async updateMediaValidation(draftId, itemId, validation, updatedAt, expectedUpdatedAt) {
            const db = await database();
            let result: LocalMediaImportDraft | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                if (current.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
                if (!current.items.some(item => item.id === itemId)) throw new Error('localMediaImport.itemNotFound');
                await transaction.runAsync(
                    `UPDATE local_media_import_items SET
                        media_validation_status = ?, media_validation_error = ?, detected_mime_type = ?,
                        width_px = ?, height_px = ?, validated_at = ?, validation_policy_version = ?
                     WHERE draft_id = ? AND id = ?`,
                    [
                        validation.mediaValidationStatus,
                        validation.mediaValidationError,
                        validation.detectedMimeType,
                        validation.widthPx,
                        validation.heightPx,
                        validation.validatedAt,
                        validation.validationPolicyVersion,
                        draftId,
                        itemId,
                    ],
                );
                await transaction.runAsync('UPDATE local_media_import_drafts SET updated_at = ? WHERE id = ?', [updatedAt, draftId]);
                result = await requireDraft(transaction, draftId);
            });
            if (!result) throw new Error('localMediaImport.itemNotFound');
            return result;
        },
        async getReferencedDraftIds() {
            const rows = await (await database()).getAllAsync<{ id: string }>('SELECT id FROM local_media_import_drafts', []);
            return new Set(rows.map(row => row.id));
        },
        async measureBytes() {
            const row = await (
                await database()
            ).getFirstAsync<{ total: number | null }>('SELECT COALESCE(SUM(byte_size), 0) AS total FROM local_media_import_items', []);
            return Math.max(0, row?.total ?? 0);
        },
        async clear() {
            await (await database()).runAsync('DELETE FROM local_media_import_drafts', []);
        },
        async consumeActive(draftId, expectedUpdatedAt) {
            const db = await database();
            await db.withExclusiveTransactionAsync(async transaction => {
                const current = await requireDraft(transaction, draftId);
                if (current.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
                await transaction.runAsync('DELETE FROM local_media_import_drafts WHERE id = ?', [draftId]);
            });
        },
    };
}

function mapItem(row: ItemRow): LocalMediaImportItem {
    return {
        id: row.id,
        position: row.position,
        localFilename: row.local_filename,
        byteSize: row.byte_size,
        mimeHint: row.mime_hint,
        createdAt: row.created_at,
        mediaValidationStatus: row.media_validation_status,
        mediaValidationError: row.media_validation_error,
        detectedMimeType: row.detected_mime_type,
        widthPx: row.width_px,
        heightPx: row.height_px,
        validatedAt: row.validated_at,
        validationPolicyVersion: row.validation_policy_version,
    };
}

export const localMediaImportRepository = createSqliteLocalMediaImportRepository();

export function registerLocalMediaImportDataParticipant(): () => void {
    return registerLocalDataParticipant({
        id: 'local-media-import-draft',
        measureBytes: async () => {
            await localMediaImportRepository.initialize();
            return localMediaImportRepository.measureBytes();
        },
        clear: async () => {
            await localMediaImportRepository.initialize();
            await localMediaImportRepository.clear();
            await appPrivateBatchFiles.clearNamespace(LOCAL_MEDIA_IMPORT_NAMESPACE);
        },
    });
}

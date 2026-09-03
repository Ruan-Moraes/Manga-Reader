import type { AppDatabase, SqlExecutor } from '@/src/shared/storage';

import { isValidTranslationLanguagePair, PENDING_MEDIA_VALIDATION, TRANSLATION_LANGUAGE_CODES } from '../../model/localMediaImport';
import { createSqliteLocalMediaImportRepository } from '../localMediaImportRepository';

interface DraftRow {
    id: string;
    created_at: number;
    updated_at: number;
    confirmed_at: number | null;
    source_language: string;
    target_language: string;
    languages_confirmed_at: number | null;
}

interface ItemRow {
    id: string;
    draft_id: string;
    position: number;
    local_filename: string;
    byte_size: number;
    mime_hint: string | null;
    created_at: number;
    media_validation_status: 'PENDING' | 'VALID' | 'INVALID';
    media_validation_error: 'MISSING_FILE' | 'EMPTY_FILE' | 'FILE_CHANGED' | 'UNSUPPORTED_FORMAT' | 'CORRUPTED' | 'DIMENSIONS_UNSAFE' | null;
    detected_mime_type: 'image/jpeg' | 'image/png' | 'image/webp' | null;
    width_px: number | null;
    height_px: number | null;
    validated_at: number | null;
    validation_policy_version: number | null;
}

type BaseItemRow = Omit<
    ItemRow,
    'media_validation_status' | 'media_validation_error' | 'detected_mime_type' | 'width_px' | 'height_px' | 'validated_at' | 'validation_policy_version'
>;

function pendingItem(row: BaseItemRow): ItemRow {
    return {
        ...row,
        media_validation_status: 'PENDING',
        media_validation_error: null,
        detected_mime_type: null,
        width_px: null,
        height_px: null,
        validated_at: null,
        validation_policy_version: null,
    };
}

function databaseFixture(
    options: {
        legacyV1?: boolean;
        legacyV2?: boolean;
        legacyV3?: boolean;
        legacyV5Language?: boolean;
        userVersion?: number;
        foreignKeyViolation?: boolean;
    } = {},
) {
    const rows = { draft: null as DraftRow | null, items: [] as ItemRow[] };
    const statements: string[] = [];
    let hasConfirmedAt = !options.legacyV1;
    let hasLanguages = !options.legacyV1 && !options.legacyV2;
    let hasValidation = !options.legacyV1 && !options.legacyV2 && !options.legacyV3;
    let hasV6LanguageSchema = false;
    let userVersion = options.userVersion ?? 0;

    const executor: SqlExecutor = {
        execAsync: async source => {
            statements.push(source);
            const version = source.match(/PRAGMA user_version = (\d+)/);
            if (version) userVersion = Number(version[1]);
            if (source.includes('ADD COLUMN confirmed_at')) hasConfirmedAt = true;
            if (source.includes('CREATE TABLE local_media_import_drafts_v3')) {
                hasLanguages = true;
                if (rows.draft) {
                    rows.draft.source_language = 'ja';
                    rows.draft.target_language = 'pt-BR';
                    rows.draft.languages_confirmed_at = null;
                }
            }
            if (source.includes('CREATE TABLE local_media_import_items_v4')) {
                hasValidation = true;
                rows.items = rows.items.map(item => pendingItem(item));
            }
            if (source.includes('CREATE TABLE local_media_import_drafts_v6')) {
                hasV6LanguageSchema = true;
                if (rows.draft) {
                    const hadLegacyChinese = rows.draft.source_language === 'zh' || rows.draft.target_language === 'zh';
                    if (rows.draft.source_language === 'zh') rows.draft.source_language = 'zh-Hans';
                    if (rows.draft.target_language === 'zh') rows.draft.target_language = 'zh-Hans';
                    if (hadLegacyChinese) rows.draft.languages_confirmed_at = null;
                }
            }
        },
        runAsync: async (source, params = []) => {
            statements.push(source);
            const values = params as unknown[];
            if (source.includes("DELETE FROM local_media_import_drafts WHERE slot = 'active'")) {
                rows.draft = null;
                rows.items = [];
            } else if (source.includes('DELETE FROM local_media_import_drafts WHERE id')) {
                rows.draft = null;
                rows.items = [];
            } else if (source.includes('DELETE FROM local_media_import_items')) {
                rows.items = rows.items.filter(item => item.id !== String(values[1]));
            } else if (source.includes('INSERT INTO local_media_import_drafts')) {
                rows.draft = {
                    id: String(values[0]),
                    created_at: Number(values[1]),
                    updated_at: Number(values[2]),
                    confirmed_at: values[3] === null ? null : Number(values[3]),
                    source_language: String(values[4]),
                    target_language: String(values[5]),
                    languages_confirmed_at: values[6] === null ? null : Number(values[6]),
                };
            } else if (source.includes('INSERT INTO local_media_import_items')) {
                rows.items.push({
                    id: String(values[0]),
                    draft_id: String(values[1]),
                    position: Number(values[2]),
                    local_filename: String(values[3]),
                    byte_size: Number(values[4]),
                    mime_hint: values[5] === null ? null : String(values[5]),
                    created_at: Number(values[6]),
                    media_validation_status: values.length >= 14 ? (String(values[7]) as ItemRow['media_validation_status']) : 'PENDING',
                    media_validation_error: values.length >= 14 ? (values[8] as ItemRow['media_validation_error']) : null,
                    detected_mime_type: values.length >= 14 ? (values[9] as ItemRow['detected_mime_type']) : null,
                    width_px: values.length >= 14 ? (values[10] as number | null) : null,
                    height_px: values.length >= 14 ? (values[11] as number | null) : null,
                    validated_at: values.length >= 14 ? (values[12] as number | null) : null,
                    validation_policy_version: values.length >= 14 ? (values[13] as number | null) : null,
                });
            } else if (source.includes("media_validation_status = 'PENDING'")) {
                const item = rows.items.find(candidate => candidate.draft_id === String(values[4]) && candidate.id === String(values[5]));
                if (item) {
                    item.local_filename = String(values[0]);
                    item.byte_size = Number(values[1]);
                    item.mime_hint = values[2] === null ? null : String(values[2]);
                    item.created_at = Number(values[3]);
                    Object.assign(item, pendingItem(item));
                }
            } else if (source.includes('media_validation_status = ?')) {
                const item = rows.items.find(candidate => candidate.draft_id === String(values[7]) && candidate.id === String(values[8]));
                if (item) {
                    item.media_validation_status = String(values[0]) as ItemRow['media_validation_status'];
                    item.media_validation_error = values[1] as ItemRow['media_validation_error'];
                    item.detected_mime_type = values[2] as ItemRow['detected_mime_type'];
                    item.width_px = values[3] as number | null;
                    item.height_px = values[4] as number | null;
                    item.validated_at = values[5] as number | null;
                    item.validation_policy_version = values[6] as number | null;
                }
            } else if (source.includes('SET position = position +')) {
                rows.items.forEach(item => {
                    if (item.draft_id === String(values[1])) item.position += Number(values[0]);
                });
            } else if (source.includes('SET position = ?')) {
                const item = rows.items.find(candidate => candidate.draft_id === String(values[1]) && candidate.id === String(values[2]));
                if (item) item.position = Number(values[0]);
            } else if (source.includes('source_language = ?')) {
                if (rows.draft) {
                    rows.draft.updated_at = Number(values[0]);
                    rows.draft.source_language = String(values[1]);
                    rows.draft.target_language = String(values[2]);
                    rows.draft.languages_confirmed_at = null;
                }
            } else if (source.includes('languages_confirmed_at = ?')) {
                if (rows.draft) {
                    rows.draft.updated_at = Number(values[0]);
                    rows.draft.languages_confirmed_at = Number(values[1]);
                }
            } else if (source.includes('UPDATE local_media_import_drafts SET updated_at = ? WHERE id')) {
                if (rows.draft) rows.draft.updated_at = Number(values[0]);
            } else if (source.includes('confirmed_at = NULL')) {
                if (rows.draft) {
                    rows.draft.updated_at = Number(values[0]);
                    rows.draft.confirmed_at = null;
                    rows.draft.languages_confirmed_at = null;
                }
            } else if (source.includes('confirmed_at = ?')) {
                if (rows.draft) {
                    rows.draft.updated_at = Number(values[0]);
                    rows.draft.confirmed_at = Number(values[1]);
                }
            }
            return {};
        },
        getFirstAsync: async <T>(source: string) => {
            if (source === 'PRAGMA user_version') return { user_version: userVersion } as T;
            if (source.includes('sqlite_master') && source.includes('local_media_import_drafts')) {
                const languageCheck = hasV6LanguageSchema ? "'ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR'" : "'ja', 'en', 'es', 'ko', 'zh', 'pt-BR'";
                return { sql: `CREATE TABLE local_media_import_drafts (source_language TEXT CHECK (source_language IN (${languageCheck})))` } as T;
            }
            if (source.includes('SUM(byte_size)')) return { total: rows.items.reduce((total, item) => total + item.byte_size, 0) } as T;
            if (source === "SELECT id FROM local_media_import_drafts WHERE slot = 'active'") return (rows.draft ? { id: rows.draft.id } : null) as T | null;
            return rows.draft as T | null;
        },
        getAllAsync: async <T>(source: string) => {
            statements.push(source);
            if (source.includes('PRAGMA foreign_key_check')) return (options.foreignKeyViolation ? [{}] : []) as T[];
            if (source.includes('PRAGMA table_info')) {
                if (source.includes('local_media_import_items')) {
                    return [{ name: 'id' }, ...(hasValidation ? [{ name: 'media_validation_status' }] : [])] as T[];
                }
                return [
                    { name: 'id' },
                    ...(hasConfirmedAt ? [{ name: 'confirmed_at' }] : []),
                    ...(hasLanguages ? [{ name: 'source_language' }, { name: 'target_language' }, { name: 'languages_confirmed_at' }] : []),
                ] as T[];
            }
            if (source.includes('FROM local_media_import_items')) return [...rows.items].sort((a, b) => a.position - b.position) as T[];
            if (source.includes('SELECT id FROM local_media_import_drafts')) return (rows.draft ? [{ id: rows.draft.id }] : []) as T[];
            return [];
        },
    };
    const database: AppDatabase = { ...executor, withExclusiveTransactionAsync: async task => task(executor) };
    return {
        database,
        rows,
        statements,
        hasConfirmedAt: () => hasConfirmedAt,
        hasLanguages: () => hasLanguages,
        hasValidation: () => hasValidation,
        hasV6LanguageSchema: () => hasV6LanguageSchema,
        userVersion: () => userVersion,
    };
}

const draft = (id = 'draft-1') => ({
    id,
    createdAt: 10,
    updatedAt: 10,
    confirmedAt: null,
    sourceLanguage: 'ja' as const,
    targetLanguage: 'pt-BR' as const,
    languagesConfirmedAt: null,
    items: [
        { ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: 'image/png', createdAt: 10 },
        { ...PENDING_MEDIA_VALIDATION, id: 'item-2', position: 1, localFilename: 'item-2', byteSize: 20, mimeHint: null, createdAt: 10 },
    ],
});

describe('MOB-FEAT-012/013 SQLite local import repository', () => {
    it('migrates a v1 draft to v2 without losing ids or order', async () => {
        const fixture = databaseFixture({ legacyV1: true });
        fixture.rows.draft = {
            id: 'legacy',
            created_at: 1,
            updated_at: 1,
            confirmed_at: null,
            source_language: '',
            target_language: '',
            languages_confirmed_at: null,
        };
        fixture.rows.items = [
            pendingItem({ id: 'b', draft_id: 'legacy', position: 1, local_filename: 'b', byte_size: 2, mime_hint: null, created_at: 1 }),
            pendingItem({ id: 'a', draft_id: 'legacy', position: 0, local_filename: 'a', byte_size: 1, mime_hint: null, created_at: 1 }),
        ];
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);

        await repository.initialize();

        expect(fixture.hasConfirmedAt()).toBe(true);
        expect(fixture.statements).toContain('ALTER TABLE local_media_import_drafts ADD COLUMN confirmed_at INTEGER;');
        expect(fixture.hasLanguages()).toBe(true);
        expect(fixture.statements).toContain('PRAGMA user_version = 6;');
        await expect(repository.getActive()).resolves.toMatchObject({
            id: 'legacy',
            confirmedAt: null,
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            languagesConfirmedAt: null,
            items: [{ id: 'a' }, { id: 'b' }],
        });
    });

    it('migrates v2 to v3 with language constraints and a clean foreign key check', async () => {
        const fixture = databaseFixture({ legacyV2: true });
        fixture.rows.draft = {
            id: 'legacy-v2',
            created_at: 1,
            updated_at: 2,
            confirmed_at: 2,
            source_language: '',
            target_language: '',
            languages_confirmed_at: null,
        };
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);

        await repository.initialize();

        expect(fixture.hasLanguages()).toBe(true);
        expect(fixture.statements.some(statement => statement.includes('CHECK (source_language <> target_language)'))).toBe(true);
        expect(fixture.statements).toContain('PRAGMA foreign_keys = OFF;');
        expect(fixture.statements).toContain('PRAGMA foreign_keys = ON;');
        await expect(repository.getActive()).resolves.toMatchObject({
            id: 'legacy-v2',
            confirmedAt: 2,
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            languagesConfirmedAt: null,
        });
    });

    it('migrates v3 items to pending v4 validation fields', async () => {
        const fixture = databaseFixture({ legacyV3: true });
        fixture.rows.draft = {
            id: 'legacy-v3',
            created_at: 1,
            updated_at: 2,
            confirmed_at: 2,
            source_language: 'en',
            target_language: 'pt-BR',
            languages_confirmed_at: 2,
        };
        fixture.rows.items = [
            pendingItem({ id: 'page', draft_id: 'legacy-v3', position: 0, local_filename: 'page', byte_size: 3, mime_hint: null, created_at: 1 }),
        ];
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);

        await repository.initialize();

        expect(fixture.hasValidation()).toBe(true);
        await expect(repository.getActive()).resolves.toMatchObject({ items: [{ id: 'page', mediaValidationStatus: 'PENDING' }] });
    });

    it('advances the shared database from v5 to v6', async () => {
        const fixture = databaseFixture({ userVersion: 5 });
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);

        await repository.initialize();

        expect(fixture.statements).toContain('PRAGMA user_version = 6;');
    });

    it('accepts exactly the 42 directed language pairs', () => {
        const pairs = TRANSLATION_LANGUAGE_CODES.flatMap(sourceLanguage =>
            TRANSLATION_LANGUAGE_CODES.map(targetLanguage => ({ sourceLanguage, targetLanguage })),
        );
        expect(pairs.filter(isValidTranslationLanguagePair)).toHaveLength(42);
        for (const language of TRANSLATION_LANGUAGE_CODES) {
            expect(isValidTranslationLanguagePair({ sourceLanguage: language, targetLanguage: language })).toBe(false);
        }
        expect(isValidTranslationLanguagePair({ sourceLanguage: 'unknown', targetLanguage: 'pt-BR' })).toBe(false);
    });

    it('stores, appends and confirms ordered metadata transactionally', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive(draft());

        await expect(
            repository.appendItems(
                'draft-1',
                [{ ...PENDING_MEDIA_VALIDATION, id: 'item-3', localFilename: 'item-3', byteSize: 10, mimeHint: 'image/jpeg', createdAt: 20 }],
                20,
            ),
        ).resolves.toMatchObject({ confirmedAt: null, items: [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3', position: 2 }] });
        await expect(repository.confirm('draft-1', 30)).resolves.toMatchObject({ confirmedAt: 30, updatedAt: 30 });
        await expect(repository.measureBytes()).resolves.toBe(40);
    });

    it('persists a page validation result without changing order or confirmations', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive({ ...draft(), confirmedAt: 9, languagesConfirmedAt: 9 });

        await expect(
            repository.updateMediaValidation(
                'draft-1',
                'item-1',
                {
                    mediaValidationStatus: 'VALID',
                    mediaValidationError: null,
                    detectedMimeType: 'image/png',
                    widthPx: 100,
                    heightPx: 200,
                    validatedAt: 11,
                    validationPolicyVersion: 1,
                },
                11,
                10,
            ),
        ).resolves.toMatchObject({
            confirmedAt: 9,
            languagesConfirmedAt: 9,
            items: [
                { id: 'item-1', position: 0, mediaValidationStatus: 'VALID' },
                { id: 'item-2', position: 1 },
            ],
        });
    });

    it('replaces one page, resets only its validation and preserves order and confirmations', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive({
            ...draft(),
            confirmedAt: 9,
            languagesConfirmedAt: 9,
            items: draft().items.map(item =>
                item.id === 'item-1'
                    ? {
                          ...item,
                          mediaValidationStatus: 'VALID' as const,
                          detectedMimeType: 'image/png' as const,
                          widthPx: 100,
                          heightPx: 200,
                          validatedAt: 11,
                          validationPolicyVersion: 1,
                      }
                    : item,
            ),
        });

        await expect(
            repository.replaceItem('draft-1', 'item-1', { localFilename: 'item-1-new', byteSize: 42, mimeHint: 'image/jpeg', createdAt: 12 }, 12, 10),
        ).resolves.toMatchObject({
            previousFilename: 'item-1',
            draft: {
                confirmedAt: 9,
                languagesConfirmedAt: 9,
                items: [
                    { id: 'item-1', position: 0, localFilename: 'item-1-new', mediaValidationStatus: 'PENDING' },
                    { id: 'item-2', position: 1, localFilename: 'item-2', mediaValidationStatus: 'PENDING' },
                ],
            },
        });
        await expect(
            repository.replaceItem('draft-1', 'item-1', { localFilename: 'stale', byteSize: 1, mimeHint: null, createdAt: 13 }, 13, 999),
        ).rejects.toThrow('localMediaImport.staleDraft');
    });

    it('reorders without changing ids and clears confirmation', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive({
            ...draft(),
            confirmedAt: 15,
            sourceLanguage: 'ko',
            targetLanguage: 'zh-Hant',
            languagesConfirmedAt: 14,
        });

        await expect(repository.reorderItems('draft-1', ['item-2', 'item-1'], 20)).resolves.toMatchObject({
            confirmedAt: null,
            sourceLanguage: 'ko',
            targetLanguage: 'zh-Hant',
            languagesConfirmedAt: null,
            items: [
                { id: 'item-2', position: 0 },
                { id: 'item-1', position: 1 },
            ],
        });
        await expect(repository.reorderItems('draft-1', ['item-1', 'unknown'], 21)).rejects.toThrow('localMediaImport.invalidOrder');
    });

    it('migrates legacy zh to zh-Hans and clears language confirmation without losing the draft', async () => {
        const fixture = databaseFixture({ legacyV5Language: true, userVersion: 5 });
        fixture.rows.draft = {
            id: 'legacy-zh',
            created_at: 1,
            updated_at: 2,
            confirmed_at: 2,
            source_language: 'zh',
            target_language: 'en',
            languages_confirmed_at: 2,
        };
        fixture.rows.items = [
            pendingItem({ id: 'page', draft_id: 'legacy-zh', position: 0, local_filename: 'page', byte_size: 3, mime_hint: null, created_at: 1 }),
        ];
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);

        await repository.initialize();

        expect(fixture.hasV6LanguageSchema()).toBe(true);
        expect(fixture.userVersion()).toBe(6);
        await expect(repository.getActive()).resolves.toMatchObject({
            id: 'legacy-zh',
            sourceLanguage: 'zh-Hans',
            targetLanguage: 'en',
            languagesConfirmedAt: null,
            items: [{ id: 'page' }],
        });
        expect(fixture.statements.some(statement => statement.includes('PRAGMA foreign_key_check'))).toBe(true);
    });

    it('rolls back the v6 rebuild when foreign key verification fails', async () => {
        const fixture = databaseFixture({ legacyV5Language: true, userVersion: 5, foreignKeyViolation: true });
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);

        await expect(repository.initialize()).rejects.toThrow('localMediaImport.foreignKeyViolation');
        expect(fixture.statements).toContain('ROLLBACK;');
        expect(fixture.statements).not.toContain('PRAGMA user_version = 6;');
    });

    it.each(
        TRANSLATION_LANGUAGE_CODES.flatMap(sourceLanguage =>
            TRANSLATION_LANGUAGE_CODES.filter(targetLanguage => targetLanguage !== sourceLanguage).map(
                targetLanguage => [sourceLanguage, targetLanguage] as const,
            ),
        ),
    )('persists and confirms the directed pair %s → %s', async (sourceLanguage, targetLanguage) => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive({ ...draft(), confirmedAt: 15 });

        const selected = await repository.updateLanguages('draft-1', { sourceLanguage, targetLanguage }, 20, 10);
        expect(selected).toMatchObject({ sourceLanguage, targetLanguage, languagesConfirmedAt: null, updatedAt: 20 });
        await expect(repository.confirmLanguages('draft-1', 30, 20)).resolves.toMatchObject({ languagesConfirmedAt: 30, updatedAt: 30 });
    });

    it('rejects invalid or stale language changes without mutating the persisted draft', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive({ ...draft(), confirmedAt: 15 });

        await expect(repository.updateLanguages('draft-1', { sourceLanguage: 'ja', targetLanguage: 'ja' }, 20, 10)).rejects.toThrow(
            'localMediaImport.invalidLanguagePair',
        );
        await expect(repository.updateLanguages('draft-1', { sourceLanguage: 'en', targetLanguage: 'es' }, 20, 999)).rejects.toThrow(
            'localMediaImport.staleDraft',
        );
        await expect(repository.getActive()).resolves.toMatchObject({ sourceLanguage: 'ja', targetLanguage: 'pt-BR', updatedAt: 10 });
    });

    it('removes an item, compacts positions and deletes the draft after the last item', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive(draft());

        await expect(repository.removeItem('draft-1', 'item-1', 20)).resolves.toMatchObject({
            filename: 'item-1',
            draft: { items: [{ id: 'item-2', position: 0 }] },
        });
        await expect(repository.removeItem('draft-1', 'item-2', 30)).resolves.toEqual({ filename: 'item-2', draft: null });
        await expect(repository.getActive()).resolves.toBeNull();
    });

    it('consumes only the exact active draft version', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteLocalMediaImportRepository(async () => fixture.database);
        await repository.replaceActive(draft());

        await expect(repository.consumeActive('draft-1', 99)).rejects.toThrow('localMediaImport.staleDraft');
        await expect(repository.getActive()).resolves.toMatchObject({ id: 'draft-1' });
        await expect(repository.consumeActive('draft-1', 10)).resolves.toBeUndefined();
        await expect(repository.getActive()).resolves.toBeNull();
    });
});

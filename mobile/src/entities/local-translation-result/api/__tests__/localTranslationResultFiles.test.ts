import type { PrivateBatchFiles } from '@/shared/files';
import type { AppDatabase, SqlExecutor } from '@/shared/storage';

import { withLocalTranslationResultFiles } from '../../model/localTranslationResultFiles';
import { createSqliteLocalTranslationResultRepository } from '../localTranslationResultRepository';

it('keeps orphan reconciliation outside an in-flight promote/commit, then reads fresh durable references', async () => {
    let release!: () => void;
    const rows: { project_id: string }[] = [];
    const files = { reconcile: jest.fn(async () => undefined), reconcileBatch: jest.fn(async () => undefined), fileExists: jest.fn(async () => true) };
    const db = {
        execAsync: async () => undefined,
        runAsync: async () => ({}),
        getFirstAsync: async (sql: string) => (sql === 'PRAGMA user_version' ? { user_version: 10 } : null),
        getAllAsync: jest.fn(async (sql: string) =>
            sql.startsWith('PRAGMA') ? [] : sql.includes('DISTINCT') ? rows : [{ page_id: 'page', rendered_filename: 'verified' }],
        ),
        withExclusiveTransactionAsync: async (work: (tx: SqlExecutor) => Promise<void>) => work(db),
    } as unknown as AppDatabase;
    const repository = createSqliteLocalTranslationResultRepository(
        async () => db,
        { initialize: async () => undefined, listAll: async () => [] },
        { initialize: async () => undefined },
        files as unknown as PrivateBatchFiles,
    );
    const commit = withLocalTranslationResultFiles(async () => {
        await new Promise<void>(resolve => {
            release = resolve;
        });
        rows.push({ project_id: 'project' });
    });
    for (let i = 0; i < 20 && !release; i++) await Promise.resolve();
    const repair = repository.reconcileFiles();
    await Promise.resolve();
    expect(files.reconcile).not.toHaveBeenCalled();
    expect(db.getAllAsync).not.toHaveBeenCalled();
    release();
    await commit;
    await repair;
    expect(files.reconcile).toHaveBeenCalledWith('translation-results', new Set(['project']));
    expect(files.reconcileBatch).toHaveBeenCalledWith('translation-results', 'project', new Set(['verified', 'verified_manifest']));
});
it('releases file ownership even after a failed acquisition', async () => {
    await expect(
        withLocalTranslationResultFiles(async () => {
            throw new Error('disk unavailable');
        }),
    ).rejects.toThrow('disk unavailable');
    await expect(withLocalTranslationResultFiles(async () => 'next')).resolves.toBe('next');
});

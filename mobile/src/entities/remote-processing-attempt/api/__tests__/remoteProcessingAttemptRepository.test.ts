import type { AppDatabase, SqlExecutor } from '@/src/shared/storage';

import { CREATE_REMOTE_PROCESSING_SCHEMA, createSqliteRemoteProcessingAttemptRepository } from '../remoteProcessingAttemptRepository';

describe('MOB-FEAT-017 SQLite v7', () => {
    it('defines the normalized consent and attempt schema with relational integrity', () => {
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain('PRIMARY KEY (project_id, disclosure_version)');
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain('REFERENCES translation_projects(id) ON DELETE CASCADE');
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain('REFERENCES translation_pages(id) ON DELETE CASCADE');
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain('UNIQUE (page_id, attempt_number)');
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain('UNIQUE (gateway_key, remote_job_ref)');
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain('uk_remote_processing_attempts_active_page');
        expect(CREATE_REMOTE_PROCESSING_SCHEMA).toContain("WHERE status IN ('CREATED', 'SUBMITTING', 'ACCEPTED', 'UNKNOWN', 'CANCEL_PENDING')");
    });

    it('runs after the project schema and advances a v6 database to v7', async () => {
        const statements: string[] = [];
        let version = 6;
        const executor: SqlExecutor = {
            execAsync: async source => {
                statements.push(source);
                const match = source.match(/PRAGMA user_version = (\d+)/);
                if (match) version = Number(match[1]);
            },
            runAsync: async () => ({}),
            getFirstAsync: async <T>(source: string) => (source === 'PRAGMA user_version' ? ({ user_version: version } as T) : null),
            getAllAsync: async <T>() => [] as T[],
        };
        const withExclusiveTransactionAsync = jest.fn(async (task: (transaction: SqlExecutor) => Promise<void>) => task(executor));
        const database: AppDatabase = { ...executor, withExclusiveTransactionAsync };
        const projects = { initialize: jest.fn(async () => undefined) };
        const repository = createSqliteRemoteProcessingAttemptRepository(async () => database, projects);

        await repository.initialize();

        expect(projects.initialize).toHaveBeenCalledTimes(1);
        expect(withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
        expect(statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS remote_processing_consents'))).toBe(true);
        expect(version).toBe(7);
    });
});

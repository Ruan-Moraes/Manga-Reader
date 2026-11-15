import { openDatabaseAsync, type SQLiteBindParams } from 'expo-sqlite';

export interface SqlExecutor {
    execAsync(source: string): Promise<void>;
    runAsync(source: string, params: SQLiteBindParams): Promise<unknown>;
    getFirstAsync<T>(source: string, params?: SQLiteBindParams): Promise<T | null>;
    getAllAsync<T>(source: string, params?: SQLiteBindParams): Promise<T[]>;
}

export interface AppDatabase extends SqlExecutor {
    withExclusiveTransactionAsync(task: (transaction: SqlExecutor) => Promise<void>): Promise<void>;
}

let databasePromise: Promise<AppDatabase> | null = null;
let schemaVersionQueue: Promise<void> = Promise.resolve();
let schemaMigrationQueue: Promise<void> = Promise.resolve();

export async function openAppDatabase(): Promise<AppDatabase> {
    databasePromise ??= openDatabaseAsync('toonlira-local.db')
        .then(async database => {
            await database.execAsync('PRAGMA foreign_keys = ON;');
            await database.execAsync('PRAGMA journal_mode = WAL;');
            return {
                execAsync: source => database.execAsync(source),
                runAsync: (source, params) => database.runAsync(source, params),
                getFirstAsync: <T>(source: string, params?: SQLiteBindParams) => database.getFirstAsync<T>(source, params ?? []),
                getAllAsync: <T>(source: string, params?: SQLiteBindParams) => database.getAllAsync<T>(source, params ?? []),
                async withExclusiveTransactionAsync(task) {
                    // Expo's built-in exclusive transaction opens another connection.
                    // PRAGMA foreign_keys is connection-local and cannot be enabled inside BEGIN.
                    const transaction = await openDatabaseAsync('toonlira-local.db', { useNewConnection: true });
                    let begun = false;
                    try {
                        await transaction.execAsync('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
                        await transaction.execAsync('BEGIN IMMEDIATE');
                        begun = true;
                        await task(transaction);
                        await transaction.execAsync('COMMIT');
                        begun = false;
                    } catch (error) {
                        if (begun) await transaction.execAsync('ROLLBACK').catch(() => undefined);
                        throw error;
                    } finally {
                        // A close error must not turn a confirmed COMMIT into a failed publication.
                        await transaction.closeAsync().catch(() => undefined);
                    }
                },
            } satisfies AppDatabase;
        })
        .catch(error => {
            databasePromise = null;
            throw error;
        });
    return databasePromise;
}

export async function readAppSchemaVersion(executor: SqlExecutor): Promise<number> {
    const row = await executor.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    return Math.max(0, row?.user_version ?? 0);
}

export function runAppDatabaseMigration<T>(task: () => Promise<T>): Promise<T> {
    const operation = schemaMigrationQueue.then(task, task);
    schemaMigrationQueue = operation.then(
        () => undefined,
        () => undefined,
    );
    return operation;
}

export async function advanceAppSchemaVersion(executor: SqlExecutor, minimumVersion: number): Promise<number> {
    const operation = schemaVersionQueue.then(async () => {
        const currentVersion = await readAppSchemaVersion(executor);
        if (currentVersion >= minimumVersion) return currentVersion;
        await executor.execAsync(`PRAGMA user_version = ${minimumVersion};`);
        return minimumVersion;
    });
    schemaVersionQueue = operation.then(
        () => undefined,
        () => undefined,
    );
    return operation;
}

export function resetAppDatabaseForTests(): void {
    databasePromise = null;
    schemaVersionQueue = Promise.resolve();
    schemaMigrationQueue = Promise.resolve();
}

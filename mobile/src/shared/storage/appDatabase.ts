import { openDatabaseAsync, type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite';

export interface SqlExecutor {
    execAsync(source: string): Promise<void>;
    runAsync(source: string, params: SQLiteBindParams): Promise<unknown>;
    getFirstAsync<T>(source: string, params?: SQLiteBindParams): Promise<T | null>;
    getAllAsync<T>(source: string, params?: SQLiteBindParams): Promise<T[]>;
}

export interface AppDatabase extends SqlExecutor {
    withExclusiveTransactionAsync(task: (transaction: SqlExecutor) => Promise<void>): Promise<void>;
}

let databasePromise: Promise<SQLiteDatabase> | null = null;
let schemaVersionQueue: Promise<void> = Promise.resolve();
let schemaMigrationQueue: Promise<void> = Promise.resolve();

export async function openAppDatabase(): Promise<AppDatabase> {
    databasePromise ??= openDatabaseAsync('manga-reader-local.db');
    return (await databasePromise) as AppDatabase;
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

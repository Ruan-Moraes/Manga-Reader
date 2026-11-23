import { openDatabaseAsync } from 'expo-sqlite';

import type { SqlExecutor } from '../appDatabase';
import { advanceAppSchemaVersion, openAppDatabase, readAppSchemaVersion, resetAppDatabaseForTests, runAppDatabaseMigration } from '../appDatabase';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

function executor(initialVersion: number) {
    let version = initialVersion;
    const execAsync = jest.fn(async (source: string) => {
        const match = source.match(/PRAGMA user_version = (\d+)/);
        if (match) version = Number(match[1]);
    });
    const sql: SqlExecutor = {
        execAsync,
        runAsync: jest.fn(),
        getFirstAsync: (async <T>(source: string) =>
            source === 'PRAGMA user_version' ? ({ user_version: version } as T) : null) as SqlExecutor['getFirstAsync'],
        getAllAsync: (async <T>() => [] as T[]) as SqlExecutor['getAllAsync'],
    };
    return { sql, execAsync, version: () => version };
}

describe('app database schema version', () => {
    afterEach(() => resetAppDatabaseForTests());

    it('enables foreign keys once when opening the shared connection', async () => {
        const execAsync = jest.fn(async () => undefined);
        jest.mocked(openDatabaseAsync).mockResolvedValue({ execAsync } as never);

        await openAppDatabase();
        await openAppDatabase();

        expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
        expect(openDatabaseAsync).toHaveBeenCalledWith('toonlira-local.db');
        expect(execAsync).toHaveBeenCalledTimes(2);
        expect(execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
        expect(execAsync).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
    });

    it('advances an older schema and reads the persisted version', async () => {
        const fixture = executor(4);
        await expect(advanceAppSchemaVersion(fixture.sql, 5)).resolves.toBe(5);
        await expect(readAppSchemaVersion(fixture.sql)).resolves.toBe(5);
        expect(fixture.execAsync).toHaveBeenCalledWith('PRAGMA user_version = 5;');
    });

    it('never downgrades a newer schema when an older repository initializes', async () => {
        const fixture = executor(5);
        await expect(advanceAppSchemaVersion(fixture.sql, 4)).resolves.toBe(5);
        expect(fixture.version()).toBe(5);
        expect(fixture.execAsync).not.toHaveBeenCalled();
    });

    it('serializes concurrent advances so a slower older repository cannot win', async () => {
        const fixture = executor(3);

        await Promise.all([advanceAppSchemaVersion(fixture.sql, 5), advanceAppSchemaVersion(fixture.sql, 4)]);

        expect(fixture.version()).toBe(5);
        expect(fixture.execAsync).toHaveBeenCalledTimes(1);
    });

    it('serializes complete schema migrations across repositories', async () => {
        const order: string[] = [];
        let releaseFirst!: () => void;
        const firstGate = new Promise<void>(resolve => {
            releaseFirst = resolve;
        });

        const first = runAppDatabaseMigration(async () => {
            order.push('first:start');
            await firstGate;
            order.push('first:end');
        });
        const second = runAppDatabaseMigration(async () => {
            order.push('second:start');
            order.push('second:end');
        });

        await Promise.resolve();
        expect(order).toEqual(['first:start']);
        releaseFirst();
        await Promise.all([first, second]);
        expect(order).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
    });
});

it('enables foreign keys on the dedicated connection before BEGIN, and closes it after commit', async () => {
    resetAppDatabaseForTests();
    let enabled = false,
        inside = false;
    const order: string[] = [];
    const connection = {
        execAsync: jest.fn(async (sql: string) => {
            order.push(sql);
            if (sql.includes('foreign_keys') && !inside) enabled = true;
            if (sql.startsWith('BEGIN')) inside = true;
            if (sql === 'COMMIT' || sql === 'ROLLBACK') inside = false;
        }),
        getFirstAsync: jest.fn(async () => ({ foreign_keys: enabled ? 1 : 0 })),
        closeAsync: jest.fn(async () => {
            order.push('close');
        }),
    };
    const base = {
        execAsync: jest.fn(async () => undefined),
        withExclusiveTransactionAsync: async (task: (tx: typeof connection) => Promise<void>) => {
            inside = true;
            await task(connection);
        },
    };
    jest.mocked(openDatabaseAsync)
        .mockResolvedValueOnce(base as never)
        .mockResolvedValueOnce(connection as never);
    const database = await openAppDatabase();
    await database.withExclusiveTransactionAsync(async tx => {
        expect(await tx.getFirstAsync('PRAGMA foreign_keys')).toEqual({ foreign_keys: 1 });
        order.push('write');
    });
    expect(openDatabaseAsync).toHaveBeenLastCalledWith('toonlira-local.db', { useNewConnection: true });
    expect(order.indexOf('write')).toBeGreaterThan(order.indexOf('BEGIN IMMEDIATE'));
    expect(order).toContain('COMMIT');
    expect(order.at(-1)).toBe('close');
    resetAppDatabaseForTests();
});

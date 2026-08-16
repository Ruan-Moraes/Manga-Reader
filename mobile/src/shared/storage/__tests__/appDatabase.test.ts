import type { SqlExecutor } from '../appDatabase';
import { advanceAppSchemaVersion, readAppSchemaVersion, runAppDatabaseMigration } from '../appDatabase';

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

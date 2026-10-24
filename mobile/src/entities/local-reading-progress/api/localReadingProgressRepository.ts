import { localTranslationResultRepository } from '@/entities/local-translation-result/@x/local-reading-progress';
import { type AppDatabase, openAppDatabase } from '@/shared/storage';

import type { LocalReadingProgress } from '../model/localReadingProgress';

interface ProgressRow {
    project_id: string;
    page_position: number;
    updated_at: number;
}

export interface LocalReadingProgressRepository {
    get(projectId: string): Promise<LocalReadingProgress | null>;
    save(progress: LocalReadingProgress): Promise<void>;
}

export function createSqliteLocalReadingProgressRepository(openDatabase: () => Promise<AppDatabase> = openAppDatabase): LocalReadingProgressRepository {
    const database = async () => {
        await localTranslationResultRepository.initialize();

        return openDatabase();
    };

    return {
        async get(projectId) {
            const row = await (
                await database()
            ).getFirstAsync<ProgressRow>('SELECT project_id, page_position, updated_at FROM local_translation_reading_progress WHERE project_id = ? LIMIT 1', [
                projectId,
            ]);

            return row ? { projectId: row.project_id, pagePosition: row.page_position, updatedAt: row.updated_at } : null;
        },
        async save(progress) {
            await (
                await database()
            ).runAsync(
                `INSERT INTO local_translation_reading_progress (project_id, page_position, updated_at)
                 VALUES (?, ?, ?)
                 ON CONFLICT(project_id) DO UPDATE SET page_position = excluded.page_position, updated_at = excluded.updated_at
                 WHERE excluded.updated_at >= local_translation_reading_progress.updated_at`,
                [progress.projectId, progress.pagePosition, progress.updatedAt],
            );
        },
    };
}

export const localReadingProgressRepository = createSqliteLocalReadingProgressRepository();

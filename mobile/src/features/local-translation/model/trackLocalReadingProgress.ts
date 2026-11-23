import { type LocalReadingProgressRepository, localReadingProgressRepository } from '@/entities/local-reading-progress';

interface Dependencies {
    progress: LocalReadingProgressRepository;
    now(): number;
}

export interface TrackLocalReadingProgressController {
    load(projectId: string): Promise<number | null>;
    save(projectId: string, pagePosition: number): Promise<void>;
}

export function createTrackLocalReadingProgressController(dependencies: Dependencies): TrackLocalReadingProgressController {
    return {
        async load(projectId) {
            return (await dependencies.progress.get(projectId))?.pagePosition ?? null;
        },
        async save(projectId, pagePosition) {
            await dependencies.progress.save({ projectId, pagePosition, updatedAt: dependencies.now() });
        },
    };
}

export const trackLocalReadingProgressController = createTrackLocalReadingProgressController({
    progress: localReadingProgressRepository,
    now: Date.now,
});

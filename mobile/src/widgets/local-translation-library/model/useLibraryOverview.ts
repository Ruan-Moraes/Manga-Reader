import { useCallback, useEffect, useRef, useState } from 'react';

import { type LocalTranslationResultRepository, localTranslationResultRepository } from '@/entities/local-translation-result';
import { hasProvenPageFailure, remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import { type ManageLocalWorksController, manageLocalWorksController } from '@/features/manage-local-works';

import { buildLibraryOverview, type LibraryOverview } from './libraryOverview';

export interface LibraryOverviewSources {
    controller?: ManageLocalWorksController;
    projects?: Pick<LocalTranslationResultRepository, 'initialize' | 'listLibrary'>;
}

export async function loadLibraryOverview({
    controller = manageLocalWorksController,
    projects = localTranslationResultRepository,
}: LibraryOverviewSources = {}): Promise<LibraryOverview> {
    const works = await controller.initialize();
    await projects.initialize();
    const [chapters, unassigned, items] = await Promise.all([
        Promise.all(works.map(work => controller.listChapters(work.id))),
        controller.listUnassignedProjectIds(),
        projects.listLibrary(),
    ]);
    if (projects !== localTranslationResultRepository) return buildLibraryOverview(works, chapters, items, unassigned);

    await remoteProcessingAttemptRepository.initialize();
    // One batched query for every unfinished page instead of one sequential query per page (revisão 2026-11-13).
    const pendingPageIds = items.flatMap(({ project }) => project.pages.filter(page => page.status !== 'READY').map(page => page.id));
    const latest = await remoteProcessingAttemptRepository.listLatestByPages(pendingPageIds);
    const evidence = new Map<string, { failedPages: number; attempted: boolean }>();
    for (const { project } of items) {
        let failedPages = 0;
        let attempted = false;
        for (const page of project.pages) {
            if (page.status === 'READY') continue;
            const attempt = latest.get(page.id) ?? null;
            if (hasProvenPageFailure(attempt)) failedPages += 1;
            if (attempt && (attempt.submittedAt !== null || attempt.status === 'CANCELLED')) attempted = true;
        }
        evidence.set(project.id, { failedPages, attempted });
    }
    return buildLibraryOverview(works, chapters, items, unassigned, evidence);
}

/** Loads the library overview; `reload` keeps the previous data visible while refreshing. */
export function useLibraryOverview(sources: LibraryOverviewSources = {}) {
    const { controller, projects } = sources;
    const [overview, setOverview] = useState<LibraryOverview | null>(null);
    const [error, setError] = useState(false);
    const latest = useRef(0);

    const reload = useCallback(async () => {
        const request = ++latest.current;
        setError(false);
        try {
            const next = await loadLibraryOverview({ controller, projects });
            if (request === latest.current) setOverview(next);
        } catch {
            if (request === latest.current) setError(true);
        }
    }, [controller, projects]);

    useEffect(() => {
        void reload();
    }, [reload]);

    return { overview, error, reload };
}

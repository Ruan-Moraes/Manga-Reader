import { useCallback, useEffect, useRef, useState } from 'react';

import { type LocalTranslationResultRepository, localTranslationResultRepository } from '@/entities/local-translation-result';
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
    return buildLibraryOverview(works, chapters, items, unassigned);
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

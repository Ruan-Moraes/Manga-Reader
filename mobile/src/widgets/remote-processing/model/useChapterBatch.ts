import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { isAmbiguousRemoteAttempt, type RemoteProcessingAttemptRepository, remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import { type TranslationProject, type TranslationProjectRepository, translationProjectRepository } from '@/entities/translation-project';
import { acquireRemoteTranslationResultController } from '@/features/acquire-remote-translation-result';
import { type StartRemoteProcessingController, startRemoteProcessingController } from '@/features/start-remote-processing';
import { getCurrentLanguage } from '@/shared/i18n';

import {
    type ChapterBatchController,
    type ChapterBatchPageStatus,
    type ChapterBatchProgress,
    createChapterBatchController,
    selectBatchPages,
} from './chapterBatch';

interface Options {
    projectId?: string;
    startController?: StartRemoteProcessingController;
    batchController?: ChapterBatchController;
    projects?: Pick<TranslationProjectRepository, 'getById' | 'getLatest' | 'initialize'>;
    attempts?: Pick<RemoteProcessingAttemptRepository, 'getLatestByPage' | 'initialize'>;
}

export function useChapterBatch({
    projectId,
    startController = startRemoteProcessingController,
    batchController,
    projects = translationProjectRepository,
    attempts = remoteProcessingAttemptRepository,
}: Options = {}) {
    const [project, setProject] = useState<TranslationProject | null>(null);
    const [capabilities, setCapabilities] = useState<RemoteProcessingCapabilities | null>(null);
    const [eligible, setEligible] = useState<string[]>([]);
    const [uncertain, setUncertain] = useState<ReadonlySet<string>>(new Set());
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    const [progress, setProgress] = useState<ChapterBatchProgress | null>(null);
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stoppedBy, setStoppedBy] = useState<string | null>(null);
    const [stopping, setStopping] = useState(false);
    const [checking, setChecking] = useState(false);
    const mounted = useRef(true);
    const abort = useRef<AbortController | null>(null);
    const stop = useRef<AbortController | null>(null);
    // Synchronous guard: two taps in the same frame (or two panels) never start two runs.
    const runningRef = useRef(false);
    const batch = useRef(
        batchController ??
            createChapterBatchController({
                start: startController,
                acquire: acquireRemoteTranslationResultController,
                sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
                maxPolls: 5,
            }),
    );

    const refresh = useCallback(
        async (signal?: AbortSignal) => {
            await Promise.all([projects.initialize(), attempts.initialize()]);
            const current = projectId ? await projects.getById(projectId) : await projects.getLatest();
            const latest = new Map<string, Awaited<ReturnType<typeof attempts.getLatestByPage>>>();
            for (const page of current?.pages ?? []) latest.set(page.id, await attempts.getLatestByPage(page.id));
            if (signal?.aborted || !mounted.current) return;
            const ids = current ? selectBatchPages(current.pages, id => latest.get(id)?.status ?? null) : [];
            setProject(current);
            setEligible(ids);
            setUncertain(
                new Set(
                    (current?.pages ?? [])
                        .filter(
                            page =>
                                page.status !== 'READY' &&
                                !ids.includes(page.id) &&
                                ['SUBMITTING', 'UNKNOWN', 'CANCEL_PENDING', 'ACCEPTED'].includes(latest.get(page.id)?.status ?? ''),
                        )
                        .map(page => page.id),
                ),
            );
            setSelected(previous => new Set(ids.filter(id => previous.size === 0 || previous.has(id))));
        },
        [attempts, projectId, projects],
    );

    useEffect(() => {
        mounted.current = true;
        const owner = new AbortController();
        void (async () => {
            try {
                await refresh(owner.signal);
                const snapshot = await startController.initialize(owner.signal);
                if (!owner.signal.aborted) setCapabilities(snapshot.capabilities);
                // After a restart, ambiguous attempts are only queried for their receipt; nothing is resent.
                if (snapshot.attempt && isAmbiguousRemoteAttempt(snapshot.attempt)) {
                    await startController.reconcile(owner.signal);
                    await refresh(owner.signal);
                }
            } catch {
                if (!owner.signal.aborted) setStoppedBy('capabilities-unavailable');
            } finally {
                if (!owner.signal.aborted) setLoading(false);
            }
        })();
        return () => {
            mounted.current = false;
            owner.abort();
            abort.current?.abort();
        };
    }, [refresh, startController]);

    // Going to the background never promises background work: no further page is sent. The page in flight is left to
    // finish; iOS `inactive` (control center, a permission prompt) does not stop anything (2026-11-10).
    useEffect(() => {
        const subscription = AppState.addEventListener('change', next => {
            if (next === 'background') stop.current?.abort();
        });
        return () => subscription.remove();
    }, []);

    const toggle = useCallback((pageId: string) => {
        setSelected(previous => {
            const next = new Set(previous);
            if (next.has(pageId)) next.delete(pageId);
            else next.add(pageId);
            return next;
        });
    }, []);

    const selectAll = useCallback((value: boolean) => setSelected(value ? new Set(eligible) : new Set()), [eligible]);

    const start = useCallback(
        async (only?: string) => {
            if (runningRef.current || !project || !capabilities) return;
            const pageIds = only ? eligible.filter(id => id === only) : eligible.filter(id => selected.has(id));
            if (pageIds.length === 0) return;
            runningRef.current = true;
            const owner = new AbortController();
            const graceful = new AbortController();
            abort.current = owner;
            stop.current = graceful;
            setRunning(true);
            setStopping(false);
            setStoppedBy(null);
            try {
                const result = await batch.current.run({
                    projectId: project.id,
                    pageIds,
                    capabilities,
                    locale: getCurrentLanguage(),
                    signal: owner.signal,
                    stopSignal: graceful.signal,
                    onProgress: value => {
                        if (mounted.current) setProgress(value);
                    },
                });
                if (mounted.current) setStoppedBy(result.stoppedBy);
            } finally {
                abort.current = null;
                stop.current = null;
                runningRef.current = false;
                if (mounted.current) {
                    setRunning(false);
                    setStopping(false);
                    await refresh().catch(() => undefined);
                }
            }
        },
        [capabilities, eligible, project, refresh, selected],
    );

    /** Hard cancel of the page in flight; kept for leaving the screen and "Cancelar agora". */
    const interrupt = useCallback(() => abort.current?.abort(), []);
    /** "Parar após a página atual": the page in flight finishes, nothing else is sent. */
    const stopAfterCurrent = useCallback(() => {
        if (!stop.current) return;
        stop.current.abort();
        setStopping(true);
    }, []);
    /** Asks the gateway again about pages left uncertain (receipt only; nothing is resent). */
    const recheck = useCallback(async () => {
        if (runningRef.current) return;
        setChecking(true);
        try {
            await startController.reconcile();
        } catch {
            // The pages stay uncertain; the user can try again later.
        } finally {
            await refresh().catch(() => undefined);
            if (mounted.current) setChecking(false);
        }
    }, [refresh, startController]);
    const reload = useCallback(() => (runningRef.current ? Promise.resolve() : refresh().catch(() => undefined)), [refresh]);
    const statusOf = (pageId: string): ChapterBatchPageStatus | 'ready' | 'idle' =>
        progress?.statuses[pageId] ??
        (project?.pages.find(page => page.id === pageId)?.status === 'READY' ? 'ready' : uncertain.has(pageId) ? 'unknown' : 'idle');

    return {
        loading,
        project,
        capabilities,
        eligible,
        uncertain,
        selected,
        progress,
        running,
        stopping,
        checking,
        stoppedBy,
        toggle,
        selectAll,
        start,
        interrupt,
        stopAfterCurrent,
        recheck,
        reload,
        statusOf,
    };
}

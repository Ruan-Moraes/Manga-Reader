import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { hasProvenPageFailure, isAmbiguousRemoteAttempt, type RemoteProcessingAttemptRepository, remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import { type TranslationProject, type TranslationProjectRepository, translationProjectRepository } from '@/entities/translation-project';
import { acquireRemoteTranslationResultController } from '@/features/acquire-remote-translation-result';
import { type StartRemoteProcessingController, startRemoteProcessingController } from '@/features/start-remote-processing';
import i18n, { getCurrentLanguage } from '@/shared/i18n';

import { backgroundBatchManager } from './backgroundBatchManager';
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

// The native manifest, interrupted-run recovery, and Android lifecycle still need end-to-end verification.
// Keep the existing foreground-only behavior until the complete service can be admitted safely.
const ANDROID_BACKGROUND_ADMITTED = process.env.EXPO_PUBLIC_TRANSLATION_BACKGROUND === 'true';
let foregroundRunActive = false;
const notificationText = () => {
    const tr = (key: string, options?: Record<string, unknown>) => i18n.t(`remoteProcessing:batch.${key}`, options);
    return {
        channel: tr('notificationChannel'), title: tr('notificationTitle'), starting: tr('notificationStarting'), stop: tr('notificationStop'), stopping: tr('notificationStopping'),
        progress: (done: number, total: number) => tr('notificationProgress', { done, total }),
        completedTitle: tr('notificationCompletedTitle'), interruptedTitle: tr('notificationInterruptedTitle'),
        completed: tr('notificationCompleted'), interrupted: tr('notificationInterrupted'),
    };
};

export function useChapterBatch({
    projectId,
    startController = startRemoteProcessingController,
    batchController,
    projects = translationProjectRepository,
    attempts = remoteProcessingAttemptRepository,
}: Options = {}) {
    const [project, setProject] = useState<TranslationProject | null>(null);
    const [capabilities, setCapabilities] = useState<RemoteProcessingCapabilities | null>(null);
    const [attemptStatuses, setAttemptStatuses] = useState<ReadonlyMap<string, string>>(new Map());
    const [eligible, setEligible] = useState<string[]>([]);
    const [uncertain, setUncertain] = useState<ReadonlySet<string>>(new Set());
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    const [localProgress, setProgress] = useState<ChapterBatchProgress | null>(null);
    const [localRunning, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [localStoppedBy, setStoppedBy] = useState<string | null>(null);
    const [localStopping, setStopping] = useState(false);
    const background = useSyncExternalStore(backgroundBatchManager.subscribe, backgroundBatchManager.getSnapshot, backgroundBatchManager.getSnapshot);
    const ownBackground = !!project && background.projectId === project.id;
    const running = localRunning || (ownBackground && background.running);
    const stopping = localStopping || (ownBackground && background.stopping);
    const progress = ownBackground && background.progress ? background.progress : localProgress;
    const stoppedBy = ownBackground && background.stoppedBy ? background.stoppedBy : localStoppedBy;
    const [checking, setChecking] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const verify = useRef<AbortController | null>(null);
    const [backgroundUnavailable, setBackgroundUnavailable] = useState(false);
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
            setAttemptStatuses(new Map([...latest].flatMap(([id, attempt]) => (attempt && (hasProvenPageFailure(attempt) || attempt.status === 'CANCELLED') ? [[id, attempt.status]] : []))));
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
                if (ANDROID_BACKGROUND_ADMITTED && Platform.OS === 'android' && !batchController && startController === startRemoteProcessingController) {
                    await backgroundBatchManager.recover();
                }
                await refresh(owner.signal);
                const snapshot = await startController.initialize(owner.signal);
                if (!owner.signal.aborted) {
                    setCapabilities(snapshot.capabilities);
                    if (snapshot.error === 'quota-exceeded') setStoppedBy(snapshot.error);
                }
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
            verify.current?.abort();
        };
    }, [batchController, refresh, startController]);

    useEffect(() => {
        if (ownBackground && !background.running && background.progress) void refresh().catch(() => undefined);
    }, [background.running, background.projectId, background.progress, ownBackground, refresh]);

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
            if (runningRef.current || foregroundRunActive || backgroundBatchManager.getSnapshot().running || !project || !capabilities) return;
            const pageIds = only ? eligible.filter(id => id === only) : eligible.filter(id => selected.has(id));
            if (pageIds.length === 0) return;
            runningRef.current = true;
            if (ANDROID_BACKGROUND_ADMITTED && Platform.OS === 'android' && !batchController && startController === startRemoteProcessingController) {
                try {
                    const started = await backgroundBatchManager.start(project.id, pageIds, capabilities, notificationText());
                    if (started) {
                        runningRef.current = false;
                        return;
                    }
                    if (mounted.current) setBackgroundUnavailable(true);
                } catch {
                    if (mounted.current) setStoppedBy('storage-unavailable');
                    runningRef.current = false;
                    return;
                }
            }
            if (foregroundRunActive) { runningRef.current = false; return; }
            foregroundRunActive = true;
            const owner = new AbortController();
            const graceful = new AbortController();
            abort.current = owner;
            stop.current = graceful;
            setProgress(null);
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
                if (mounted.current) {
                    setStoppedBy(result.stoppedBy);
                    setEligible(previous => previous.filter(id => !['saved', 'unknown'].includes(result.statuses[id] ?? '')));
                }
            } finally {
                if (mounted.current) await refresh().catch(() => undefined);
                abort.current = null;
                stop.current = null;
                runningRef.current = false;
                foregroundRunActive = false;
                if (mounted.current) {
                    setRunning(false);
                    setStopping(false);
                }
            }
        },
        [batchController, capabilities, eligible, project, refresh, selected, startController],
    );

    /** Hard cancel of the page in flight; kept for leaving the screen and "Cancelar agora". */
    const interrupt = useCallback(() => {
        if (backgroundBatchManager.getSnapshot().running) backgroundBatchManager.interrupt();
        else abort.current?.abort();
    }, []);
    /** "Parar após a página atual": the page in flight finishes, nothing else is sent. */
    const stopAfterCurrent = useCallback(() => {
        if (backgroundBatchManager.getSnapshot().running) {
            backgroundBatchManager.stopAfterCurrent();
            return;
        }
        if (!stop.current) return;
        stop.current.abort();
        setStopping(true);
    }, []);
    /** Asks the gateway again about pages left uncertain (receipt only; nothing is resent). */
    const recheck = useCallback(async () => {
        if (runningRef.current) return;
        setChecking(true);
        try {
            const snapshot = await startController.reconcile();
            if (mounted.current && snapshot.capabilities) setCapabilities(snapshot.capabilities);
        } catch {
            // The pages stay uncertain; the user can try again later.
        } finally {
            await refresh().catch(() => undefined);
            if (mounted.current) setChecking(false);
        }
    }, [refresh, startController]);
    // Same condition as the panel's "unavailable" message (MOB-FEAT-067).
    const capabilitiesUnavailable = stoppedBy === 'capabilities-unavailable' || (capabilities?.enabled !== true && !stoppedBy);
    const canRetryCapabilities = !loading && capabilitiesUnavailable && !running && !background.running && !background.pausedRun;
    /** Asks the gateway for capabilities again (MOB-FEAT-067): nothing is sent, consent and selection are untouched. */
    const retryCapabilities = useCallback(async () => {
        const snapshotNow = backgroundBatchManager.getSnapshot();
        if (verify.current || runningRef.current || foregroundRunActive || snapshotNow.running || snapshotNow.pausedRun) return;
        const owner = new AbortController();
        verify.current = owner;
        setVerifying(true);
        try {
            const snapshot = await startController.initialize(owner.signal);
            if (owner.signal.aborted || !mounted.current) return;
            setCapabilities(snapshot.capabilities);
            setStoppedBy(snapshot.error === 'quota-exceeded' || snapshot.error === 'capabilities-unavailable' ? snapshot.error : null);
        } catch {
            if (!owner.signal.aborted && mounted.current) setStoppedBy('capabilities-unavailable');
        } finally {
            if (verify.current === owner) verify.current = null;
            if (mounted.current) setVerifying(false);
        }
    }, [startController]);
    const reload = useCallback(() => (runningRef.current ? Promise.resolve() : refresh().catch(() => undefined)), [refresh]);
    const resumeBackground = useCallback(async () => {
        if (!capabilities) return;
        try {
            if (!(await backgroundBatchManager.resume(capabilities, notificationText())) && mounted.current) setBackgroundUnavailable(true);
        } catch {
            if (mounted.current) setStoppedBy('storage-unavailable');
        }
    }, [capabilities]);
    const discardBackground = useCallback(async () => {
        await backgroundBatchManager.discardPaused();
        await refresh();
    }, [refresh]);
    // Indexed once per change: statusOf runs for every page on every render (rows, summary, percentage, strip), so a
    // linear search per call made each progress tick quadratic on long chapters (revisão 2026-11-13).
    const pageStatusById = useMemo(() => new Map(project?.pages.map(page => [page.id, page.status]) ?? []), [project]);
    const eligibleSet = useMemo(() => new Set(eligible), [eligible]);
    const cancelledSet = useMemo(() => new Set(progress?.cancelledPageIds ?? []), [progress?.cancelledPageIds]);
    const isEligible = useCallback((pageId: string) => eligibleSet.has(pageId), [eligibleSet]);

    const statusOf = (pageId: string): ChapterBatchPageStatus | 'ready' | 'idle' | 'cancelled' => {
        if (pageStatusById.get(pageId) === 'READY') return 'ready';
        const runStatus = progress?.statuses[pageId];
        if (running && (runStatus === 'pending' || runStatus === 'processing')) return runStatus;
        if (cancelledSet.has(pageId)) return 'cancelled';
        if (runStatus === 'saved') return 'saved';
        if (uncertain.has(pageId) || (runStatus === 'unknown' && !eligibleSet.has(pageId))) return 'unknown';
        const attempt = attemptStatuses.get(pageId);
        if (attempt === 'CANCELLED') return 'cancelled';
        if (attempt === 'FAILED' || attempt === 'REJECTED') return 'failed';
        return 'idle';
    };

    return {
        loading,
        project,
        capabilities,
        eligible,
        isEligible,
        uncertain,
        selected,
        progress,
        running,
        stopping,
        checking,
        verifying,
        canRetryCapabilities,
        retryCapabilities,
        stoppedBy,
        backgroundUnavailable,
        otherBatchRunning: background.running && !ownBackground,
        pausedRun: background.pausedRun,
        resumeBackground,
        discardBackground,
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

import type { AcquireRemoteTranslationResultController, AcquisitionSnapshot } from '@/features/acquire-remote-translation-result';
import type { RemoteProcessingSnapshot, StartRemoteProcessingController } from '@/features/start-remote-processing';

import { type ChapterBatchProgress, createChapterBatchController, selectBatchPages } from '../chapterBatch';

const capabilities = { disclosure: { version: 'v1' } } as never;
const accepted = (pageId: string): RemoteProcessingSnapshot =>
    ({ project: null, capabilities, error: null, attempt: { id: `attempt-${pageId}`, pageId, status: 'ACCEPTED' } }) as never;
const failed = (error: RemoteProcessingSnapshot['error'], status = 'FAILED'): RemoteProcessingSnapshot =>
    ({ project: null, capabilities, error, attempt: { id: 'x', status } }) as never;
const ready = (pageId: string): AcquisitionSnapshot => ({ status: 'ready', stage: 1, projectId: 'p', pageId, error: null });

function setup(submit: jest.Mock, run: jest.Mock) {
    const start = { submit, acceptConsent: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<StartRemoteProcessingController>;
    const acquire = { run } as unknown as jest.Mocked<AcquireRemoteTranslationResultController>;
    return { start, acquire, controller: createChapterBatchController({ start, acquire, sleep: async () => undefined, maxPolls: 3 }) };
}
const base = (pageIds: string[], onProgress?: (p: ChapterBatchProgress) => void, signal?: AbortSignal) => ({
    projectId: 'p',
    pageIds,
    capabilities,
    locale: 'pt-BR' as const,
    onProgress,
    signal,
});

it('processes pages strictly one after another and reports per-page and aggregate progress', async () => {
    const order: string[] = [];
    let inFlight = 0;
    const submit = jest.fn(async (_p: string, _s: AbortSignal | undefined, pageId: string) => {
        inFlight += 1;
        expect(inFlight).toBe(1);
        order.push(`submit:${pageId}`);
        inFlight -= 1;
        return accepted(pageId);
    });
    const run = jest.fn(async (attemptId: string) => ready(attemptId.replace('attempt-', '')));
    const { controller } = setup(submit, run);
    const seen: ChapterBatchProgress[] = [];
    const result = await controller.run(base(['a', 'b', 'c'], p => seen.push(p)));
    expect(order).toEqual(['submit:a', 'submit:b', 'submit:c']);
    expect(result.statuses).toEqual({ a: 'saved', b: 'saved', c: 'saved' });
    expect(seen[0].statuses).toEqual({ a: 'pending', b: 'pending', c: 'pending' });
    expect(seen.some(p => p.statuses.a === 'processing' && p.statuses.b === 'pending')).toBe(true);
    expect(seen.at(-1)).toMatchObject({ completed: 3, total: 3 });
});

it('keeps going after a known failure and keeps earlier saved pages', async () => {
    const submit = jest.fn(async (_p: string, _s: AbortSignal | undefined, pageId: string) =>
        pageId === 'b' ? failed('gateway-rejected', 'REJECTED') : accepted(pageId),
    );
    const run = jest.fn(async (id: string) => ready(id.replace('attempt-', '')));
    const { controller, start } = setup(submit, run);
    const result = await controller.run(base(['a', 'b', 'c']));
    expect(result.statuses).toEqual({ a: 'saved', b: 'failed', c: 'saved' });
    expect(start.submit).toHaveBeenCalledTimes(3);
});

it('marks an ambiguous submission as unknown, never resubmits it and continues', async () => {
    const submit = jest.fn(async (_p: string, _s: AbortSignal | undefined, pageId: string) =>
        pageId === 'a' ? failed('submission-unknown', 'UNKNOWN') : accepted(pageId),
    );
    const run = jest.fn(async (id: string) => ready(id.replace('attempt-', '')));
    const { controller, start } = setup(submit, run);
    const result = await controller.run(base(['a', 'b']));
    expect(result.statuses).toEqual({ a: 'unknown', b: 'saved' });
    expect(start.submit.mock.calls.filter(call => call[2] === 'a')).toHaveLength(1);
});

it('stops on a global condition and leaves the rest unsent (back to their stored state)', async () => {
    const submit = jest.fn(async (_p: string, _s: AbortSignal | undefined, pageId: string) =>
        pageId === 'b' ? failed('capabilities-unavailable', 'FAILED') : accepted(pageId),
    );
    const run = jest.fn(async (id: string) => ready(id.replace('attempt-', '')));
    const { controller } = setup(submit, run);
    const result = await controller.run(base(['a', 'b', 'c']));
    expect(result.statuses).toEqual({ a: 'saved', b: 'failed' });
    expect(result.stoppedBy).toBe('capabilities-unavailable');
});

it('stops without submitting more pages when aborted', async () => {
    const abort = new AbortController();
    const submit = jest.fn(async (_p: string, _s: AbortSignal | undefined, pageId: string) => {
        abort.abort();
        return accepted(pageId);
    });
    const run = jest.fn(async (id: string) => ready(id.replace('attempt-', '')));
    const { controller } = setup(submit, run);
    const result = await controller.run(base(['a', 'b'], undefined, abort.signal));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(result.statuses.b).toBeUndefined();
    expect(result.statuses.a).not.toBe('saved');
});

it('treats an acquisition that never completes as unknown instead of resending', async () => {
    const submit = jest.fn(async (_p: string, _s: AbortSignal | undefined, pageId: string) => accepted(pageId));
    const run = jest.fn(async () => ({ status: 'waiting', stage: 0, projectId: 'p', pageId: 'a', error: null }) as AcquisitionSnapshot);
    const { controller } = setup(submit, run);
    const result = await controller.run(base(['a']));
    expect(result.statuses.a).toBe('unknown');
    expect(run).toHaveBeenCalledTimes(3);
    expect(submit).toHaveBeenCalledTimes(1);
});

it('selects never-tried pages and known-failed pages, never ambiguous or ready ones', () => {
    const page = (id: string, status: string, position: number) => ({ id, status, position }) as never;
    const pages = [page('a', 'DRAFT', 0), page('b', 'FAILED', 1), page('c', 'READY', 2), page('d', 'FAILED', 3), page('e', 'PROCESSING', 4)];
    const attempts: Record<string, string> = { b: 'REJECTED', d: 'UNKNOWN' };
    expect(selectBatchPages(pages, id => (attempts[id] ?? null) as never)).toEqual(['a', 'b']);
});

it('"Parar após a página atual" deixa a página em envio terminar e não envia as próximas (2026-11-10)', async () => {
    const stop = new AbortController();
    const submit = jest.fn(async (_p: string, signal: AbortSignal | undefined, pageId: string) => {
        stop.abort();
        expect(signal?.aborted ?? false).toBe(false);
        return accepted(pageId);
    });
    const run = jest.fn(async (id: string) => ready(id.replace('attempt-', '')));
    const { controller } = setup(submit, run);
    const result = await controller.run({ ...base(['a', 'b', 'c']), stopSignal: stop.signal });
    expect(result.statuses).toEqual({ a: 'saved' });
    expect(submit).toHaveBeenCalledTimes(1);
});

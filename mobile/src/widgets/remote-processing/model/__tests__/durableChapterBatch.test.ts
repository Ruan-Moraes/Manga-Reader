import { createChapterBatchController } from '../chapterBatch';
import { runDurableChapterBatch } from '../durableChapterBatch';

const run = { id: 'run', projectId: 'project', state: 'active' as const, items: [{ pageId: 'page', position: 0, state: 'pending' as const }] };
const input = { capabilities: {} as never, locale: 'pt-BR' as const };

it('persists the processing state before submitting a page', async () => {
    const order: string[] = [];
    const start = {
        acceptConsent: jest.fn(async () => {
            order.push('consent');
        }),
        submit: jest.fn(async () => {
            order.push('submit');
            return { attempt: null, error: 'gateway-rejected' } as never;
        }),
    };
    const controller = createChapterBatchController({ start, acquire: { run: jest.fn() }, sleep: async () => undefined, maxPolls: 1 });
    const queue = {
        setItem: jest.fn(async (_run: string, _page: string, state: string) => {
            order.push(state);
        }),
        setRun: jest.fn(async () => undefined),
    };
    await runDurableChapterBatch(run, input, { controller, queue, now: () => 5 });
    expect(order).toEqual(['processing', 'consent', 'submit', 'failed']);
    expect(queue.setRun).toHaveBeenCalledWith('run', 'paused', 5);
});

it('never sends the page if recording its processing state fails', async () => {
    const start = { acceptConsent: jest.fn(), submit: jest.fn() };
    const controller = createChapterBatchController({ start, acquire: { run: jest.fn() }, sleep: async () => undefined, maxPolls: 1 });
    const queue = {
        setItem: jest.fn(async () => {
            throw new Error('disk');
        }),
        setRun: jest.fn(async () => undefined),
    };
    await expect(runDurableChapterBatch(run, input, { controller, queue, now: () => 5 })).rejects.toThrow('disk');
    expect(start.submit).not.toHaveBeenCalled();
    expect(queue.setRun).toHaveBeenCalledWith('run', 'paused', 5);
});

it('does not report completion when an earlier page is still uncertain', async () => {
    const controller = { run: jest.fn(async () => ({ statuses: {}, stoppedBy: null })) };
    const queue = { setItem: jest.fn(async () => undefined), setRun: jest.fn(async () => undefined) };
    const uncertain = { ...run, items: [{ pageId: 'page', position: 0, state: 'unknown' as const }] };
    await runDurableChapterBatch(uncertain, input, { controller, queue, now: () => 5 });
    expect(queue.setRun).toHaveBeenCalledWith('run', 'paused', 5);
});

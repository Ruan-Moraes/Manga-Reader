import { chapterBatchQueueRepository } from '@/entities/remote-processing-attempt';
import { startRemoteProcessingController } from '@/features/start-remote-processing';

import { androidBatchServiceState, finishAndroidBatchService, startAndroidBatchService } from '../androidBatchService';
import { backgroundBatchManager } from '../backgroundBatchManager';
import { runDurableChapterBatch } from '../durableChapterBatch';

jest.mock('@/entities/remote-processing-attempt', () => ({
    chapterBatchQueueRepository: { create: jest.fn(), getOpen: jest.fn(), setRun: jest.fn(), setItem: jest.fn(), pauseInterrupted: jest.fn(async () => undefined), stopRequested: jest.fn(async () => false) },
}));
jest.mock('../androidBatchService', () => ({
    startAndroidBatchService: jest.fn(),
    finishAndroidBatchService: jest.fn(async () => undefined),
    updateAndroidBatchNotification: jest.fn(async () => undefined),
    androidBatchServiceState: jest.fn(),
}));
jest.mock('../durableChapterBatch', () => ({ runDurableChapterBatch: jest.fn() }));
jest.mock('@/features/start-remote-processing', () => ({ startRemoteProcessingController: { submit: jest.fn(), acceptConsent: jest.fn() } }));

const text = {
    channel: 'Translation',
    title: 'Translation',
    starting: 'Starting',
    stop: 'Stop',
    stopping: 'Stopping...',
    progress: () => 'Progress',
    completedTitle: 'Complete',
    interruptedTitle: 'Interrupted',
    completed: 'Done',
    interrupted: 'Stopped',
};

it('never submits when notifications are unavailable and closes the unused queue', async () => {
    (chapterBatchQueueRepository.create as jest.Mock).mockResolvedValue(undefined);
    (chapterBatchQueueRepository.getOpen as jest.Mock).mockResolvedValue({
        id: 'run',
        projectId: 'p',
        state: 'active',
        items: [{ pageId: 'a', position: 0, state: 'pending' }],
    });
    (startAndroidBatchService as jest.Mock).mockResolvedValue(false);
    const started = await backgroundBatchManager.start('p', ['a'], {} as never, text);
    expect(started).toBe(false);
    expect(startRemoteProcessingController.submit).not.toHaveBeenCalled();
    expect(chapterBatchQueueRepository.setRun).toHaveBeenCalledWith('run', 'cancelled', expect.any(Number));
    expect(backgroundBatchManager.getSnapshot().running).toBe(false);
});

it('keeps the job in the service while no screen subscribes and publishes its completion', async () => {
    let work!: () => Promise<void>;
    (chapterBatchQueueRepository.getOpen as jest.Mock).mockResolvedValueOnce({
        id: 'run2', projectId: 'p', state: 'active', items: [{ pageId: 'a', position: 0, state: 'pending' }],
    }).mockResolvedValueOnce(null);
    (startAndroidBatchService as jest.Mock).mockImplementationOnce(async (_run, _project, _text, fn) => { work = fn; return true; });
    (androidBatchServiceState as jest.Mock).mockResolvedValue({ running: true, stopRequested: false });
    (runDurableChapterBatch as jest.Mock).mockImplementationOnce(async (_run, _input, deps) => {
        await deps.onProgress({ statuses: { a: 'saved' }, completed: 1, total: 1 });
        return { statuses: { a: 'saved' }, stoppedBy: null };
    });
    expect(await backgroundBatchManager.start('p', ['a'], {} as never, text)).toBe(true);
    expect(backgroundBatchManager.getSnapshot()).toMatchObject({ running: true, notificationActive: true });
    await work();
    expect(finishAndroidBatchService).toHaveBeenCalledWith(text, true);
    expect(backgroundBatchManager.getSnapshot()).toMatchObject({ running: false, notificationActive: false });
});

it('offers interrupted work only after recovery and does not submit on denied resume', async () => {
    const paused = { id: 'run3', projectId: 'p', state: 'paused', items: [
        { pageId: 'a', position: 0, state: 'unknown' }, { pageId: 'b', position: 1, state: 'pending' },
    ] };
    (chapterBatchQueueRepository.getOpen as jest.Mock).mockResolvedValueOnce(paused).mockResolvedValueOnce({ ...paused, state: 'active' });
    (startAndroidBatchService as jest.Mock).mockResolvedValueOnce(false);
    await backgroundBatchManager.recover();
    expect(backgroundBatchManager.getSnapshot().pausedRun).toEqual(paused);
    expect(startRemoteProcessingController.submit).not.toHaveBeenCalled();
    expect(await backgroundBatchManager.resume({} as never, text)).toBe(false);
    expect(chapterBatchQueueRepository.setRun).toHaveBeenCalledWith('run3', 'paused', expect.any(Number));
    await backgroundBatchManager.discardPaused();
    expect(chapterBatchQueueRepository.setRun).toHaveBeenCalledWith('run3', 'cancelled', expect.any(Number));
});

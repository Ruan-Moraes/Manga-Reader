let mockTask: ((data: { runId: string }) => Promise<void>) | undefined;
const mockNative = {
    notificationsAllowed: jest.fn(async () => true),
    start: jest.fn(async (runId: string) => { void mockTask?.({ runId }); }),
    update: jest.fn(async () => undefined), finish: jest.fn(async () => undefined),
    state: jest.fn(async () => ({ running: false, stopRequested: false })),
};
jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockNative }));
jest.mock('react-native', () => {
    const actual = jest.requireActual('react-native');
    return Object.create(actual, {
        Platform: { value: { OS: 'android', Version: 34 } },
        AppRegistry: { value: { registerHeadlessTask: (_name: string, provider: () => typeof mockTask) => { mockTask = provider(); } } },
        PermissionsAndroid: { value: { PERMISSIONS: { POST_NOTIFICATIONS: 'notification' }, RESULTS: { GRANTED: 'granted' }, request: jest.fn(async () => 'granted') } },
    });
});
jest.mock('@/entities/remote-processing-attempt', () => ({ chapterBatchQueueRepository: { pauseInterrupted: jest.fn(async () => undefined) } }));
const { androidBatchServiceState, finishAndroidBatchService, startAndroidBatchService, updateAndroidBatchNotification } = require('../androidBatchService') as typeof import('../androidBatchService');

const text = { channel: 'Translation', title: 'Translation', starting: 'Starting', stop: 'Stop', stopping: 'Stopping...', progress: (done: number, total: number) => `${done}/${total}`, completedTitle: 'Complete', interruptedTitle: 'Interrupted', completed: 'Done', interrupted: 'Stopped' };

it('starts one headless task and updates and finishes the native notification', async () => {
    const work = jest.fn(async () => undefined);
    expect(await startAndroidBatchService('run', 'project', text, work)).toBe(true);
    expect(work).toHaveBeenCalledTimes(1);
    expect(mockNative.start).toHaveBeenCalledWith('run', 'project', 'Translation', 'Starting', 'Stop', 'Stopping...', 'Translation');
    await updateAndroidBatchNotification(text, 1, 3);
    expect(mockNative.update).toHaveBeenCalledWith('run', '1/3', 1, 3);
    expect(await androidBatchServiceState('run')).toEqual({ running: false, stopRequested: false });
    await finishAndroidBatchService(text, true);
    expect(mockNative.finish).toHaveBeenCalledWith('run', 'Complete', 'Done');
});

it('does not start a task when notifications are blocked', async () => {
    mockNative.notificationsAllowed.mockResolvedValueOnce(false);
    const work = jest.fn();
    expect(await startAndroidBatchService('run2', 'project', text, work)).toBe(false);
    expect(work).not.toHaveBeenCalled();
});

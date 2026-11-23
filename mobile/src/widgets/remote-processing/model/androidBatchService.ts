import { AppRegistry, PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

import { chapterBatchQueueRepository } from '@/entities/remote-processing-attempt';

export interface TranslationNotificationText {
    channel: string;
    title: string;
    starting: string;
    stop: string;
    stopping: string;
    progress(done: number, total: number): string;
    completedTitle: string;
    interruptedTitle: string;
    completed: string;
    interrupted: string;
}
interface NativeService {
    notificationsAllowed(): Promise<boolean>;
    start(runId: string, projectId: string, title: string, body: string, stop: string, stopping: string, channel: string): Promise<void>;
    update(runId: string, body: string, done: number, total: number): Promise<void>;
    finish(runId: string, title: string, body: string): Promise<void>;
    state(runId: string): Promise<{ running: boolean; stopRequested: boolean }>;
}
const native = Platform.OS === 'android' ? requireOptionalNativeModule<NativeService>('ToonliraTranslationBackground') : null;
let registered = false;
let activeRunId: string | undefined;
let pendingWork: (() => Promise<void>) | undefined;
let acknowledge: (() => void) | undefined;

/** Must be called from the app entry, before Android starts a headless task. */
export function registerAndroidBatchService(): void {
    if (registered || Platform.OS !== 'android') return;
    registered = true;
    AppRegistry.registerHeadlessTask('ToonliraTranslation', () => async (data: { runId?: string }) => {
        const work = data.runId === activeRunId ? pendingWork : undefined;
        pendingWork = undefined;
        if (!work) {
            // A new JS process cannot recover a volatile in-flight delivery.
            await chapterBatchQueueRepository.pauseInterrupted(Date.now()).catch(() => undefined);
            return;
        }
        acknowledge?.();
        acknowledge = undefined;
        await work();
    });
}

export async function startAndroidBatchService(
    runId: string,
    projectId: string,
    text: TranslationNotificationText,
    work: () => Promise<void>,
): Promise<boolean> {
    if (Platform.OS !== 'android' || !native || activeRunId) return false;
    registerAndroidBatchService();
    activeRunId = runId;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        if (Number(Platform.Version) >= 33) {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) { activeRunId = undefined; return false; }
        }
        if (!(await native.notificationsAllowed())) { activeRunId = undefined; return false; }
        pendingWork = work;
        const accepted = new Promise<boolean>(resolve => {
            acknowledge = () => { if (timer) clearTimeout(timer); resolve(true); };
            timer = setTimeout(() => resolve(false), 10000);
        });
        await native.start(runId, projectId, text.title, text.starting, text.stop, text.stopping, text.channel);
        if (await accepted) return true;
        pendingWork = undefined;
        acknowledge = undefined;
        activeRunId = undefined;
        throw new Error('background.serviceNotStarted');
    } catch (error) {
        if (timer) clearTimeout(timer);
        pendingWork = undefined;
        acknowledge = undefined;
        activeRunId = undefined;
        throw error;
    }
}

export async function androidBatchServiceState(runId: string): Promise<{ running: boolean; stopRequested: boolean }> {
    return native ? native.state(runId) : { running: false, stopRequested: true };
}

export async function updateAndroidBatchNotification(text: TranslationNotificationText, done: number, total: number): Promise<void> {
    if (native && activeRunId) await native.update(activeRunId, text.progress(done, total), done, total);
}

export async function finishAndroidBatchService(text: TranslationNotificationText, completed: boolean): Promise<void> {
    const runId = activeRunId;
    pendingWork = undefined;
    acknowledge = undefined;
    if (!native || !runId) return;
    try {
        await native.finish(runId, completed ? text.completedTitle : text.interruptedTitle, completed ? text.completed : text.interrupted);
        // Let Android remove the foreground service before the headless task returns.
        for (let attempt = 0; attempt < 20 && (await native.state(runId)).running; attempt += 1) await new Promise(resolve => setTimeout(resolve, 100));
    } finally { activeRunId = undefined; }
}

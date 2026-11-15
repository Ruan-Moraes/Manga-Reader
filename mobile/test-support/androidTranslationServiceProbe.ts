import { androidBatchServiceState, finishAndroidBatchService, startAndroidBatchService, updateAndroidBatchNotification } from '@/widgets/remote-processing';

/** Synthetic native lifecycle probe, included only in a purpose-built local test APK. */
export async function runProbe(): Promise<void> {
    const id = '12345678-1234-4234-8234-123456789abc';
    const text = { channel: 'Teste Toonlira', title: 'Teste de tradução', starting: 'Preparando teste', stop: 'Parar após página', stopping: 'Parando...', progress: (done: number, total: number) => `${done}/${total}`, completedTitle: 'Teste concluído', interruptedTitle: 'Teste interrompido', completed: 'Resultado de teste', interrupted: 'Teste parado' };
    try {
        const started = await startAndroidBatchService(id, id, text, async () => {
            console.info('TOONLIRA_PROBE_TASK_STARTED');
            await updateAndroidBatchNotification(text, 1, 2);
            await new Promise(resolve => setTimeout(resolve, 45000));
            const state = await androidBatchServiceState(id);
            console.info(`TOONLIRA_PROBE_STATE running=${state.running} stopped=${state.stopRequested}`);
            await finishAndroidBatchService(text, !state.stopRequested && state.running);
            console.info('TOONLIRA_PROBE_TASK_FINISHED');
        });
        console.info(`TOONLIRA_PROBE_STARTED ${started}`);
    } catch {
        console.info('TOONLIRA_PROBE_FAILED');
    }
}

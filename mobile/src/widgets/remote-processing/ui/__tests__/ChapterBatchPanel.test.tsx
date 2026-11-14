import { Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationPage } from '@/entities/translation-page';
import type { TranslationProject } from '@/entities/translation-project';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import { useDeveloperMode } from '@/shared/config';
import i18n from '@/shared/i18n';

import { backgroundBatchManager } from '../../model/backgroundBatchManager';
import type { ChapterBatchController } from '../../model/chapterBatch';
import { ChapterBatchPanel } from '../ChapterBatchPanel';

let mockFocus: (() => void) | null = null;
jest.mock('expo-router', () => ({
    router: { push: jest.fn() },
    useFocusEffect: (effect: () => void) => {
        mockFocus = effect;
    },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

const page = (id: string, position: number, status: TranslationPage['status']): TranslationPage => ({
    id,
    projectId: 'project-1',
    position,
    originalFilename: `${id}.jpg`,
    originalByteSize: 10,
    originalMimeType: 'image/jpeg',
    widthPx: 10,
    heightPx: 10,
    mediaValidatedAt: 1,
    mediaValidationPolicyVersion: 1,
    status,
    createdAt: 1,
    updatedAt: 1,
    statusUpdatedAt: 1,
});
const project: TranslationProject = {
    id: 'project-1',
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    status: 'PROCESSING',
    createdAt: 1,
    updatedAt: 1,
    statusUpdatedAt: 1,
    languageReviewRequired: false,
    pages: [page('p1', 0, 'READY'), page('p2', 1, 'DRAFT'), page('p3', 2, 'FAILED'), page('p4', 3, 'DRAFT')],
};
const capabilities: RemoteProcessingCapabilities = {
    contractVersion: '2.0',
    transport: 'volatile-direct-response',
    gatewayKey: 'gateway-alpha',
    generatedAt: '2026-09-02T12:00:00.000Z',
    validUntil: '2099-09-02T12:05:00.000Z',
    enabled: true,
    supportedLanguages: ['ja', 'pt-BR'],
    supportedPairs: [{ source: 'ja', target: 'pt-BR' }],
    mediaLimits: {
        mimeTypes: ['image/jpeg'],
        maxBytes: 100,
        maxWidthPx: 100,
        maxHeightPx: 100,
        maxPixels: 10_000,
        maxResultBytes: 67108864,
        maxManifestBytes: 4194304,
    },
    dailyInstallationQuota: 20,
    dailyGlobalQuota: 100,
    disclosure: {
        version: 'volatile-1',
        operatorName: 'Toonlira',
        operatorContact: 'privacy@toonlira.com',
        privacyPolicyUrl: 'https://toonlira.com/privacy',
        termsUrl: 'https://toonlira.com/terms',
        gatewayRegion: 'southamerica-east1',
        ocrRegion: 'us',
        translationLocation: 'global',
        contentProcessing: 'in-memory-only',
        resultStorage: 'user-device',
        sanitizedOperationalLogs: true,
        idempotencyKeyFormat: 'uuid-v7',
        receiptValiditySeconds: 604800,
        providerTrainingPolicy: 'No training.',
    },
};

const start = {
    initialize: jest.fn(async () => ({ project, capabilities, attempt: null, error: null })),
} as unknown as StartRemoteProcessingController;
const attemptStatus: Record<string, string> = { p3: 'REJECTED', p4: 'UNKNOWN' };
const repositories = {
    projects: { initialize: jest.fn(async () => undefined), getById: jest.fn(async () => project), getLatest: jest.fn(async () => project) },
    attempts: {
        initialize: jest.fn(async () => undefined),
        getLatestByPage: jest.fn(async (id: string) => (attemptStatus[id] ? { status: attemptStatus[id] } : null) as never),
    },
};

describe('MOB-FEAT-055 chapter batch panel', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('offers only never-tried and known-failed pages and starts the selected ones after consent', async () => {
        const run = jest.fn<ReturnType<ChapterBatchController['run']>, Parameters<ChapterBatchController['run']>>(async input => {
            input.onProgress?.({ statuses: { p2: 'saved', p3: 'saved' }, completed: 2, total: 2 });
            return { statuses: { p2: 'saved', p3: 'saved' }, stoppedBy: null };
        });
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);

        const first = await screen.findByRole('checkbox', { name: 'Página 1. pronta' });
        expect(screen.getByRole('progressbar', { name: 'Progresso da tradução' })).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 25 });
        expect(first.props.accessibilityState).toMatchObject({ disabled: true, checked: false });
        expect(screen.getByRole('checkbox', { name: 'Página 4. resultado incerto' }).props.accessibilityState.disabled).toBe(true);
        expect(screen.getByRole('checkbox', { name: 'Página 2. aguardando' }).props.accessibilityState.checked).toBe(true);

        fireEvent.press(screen.getByRole('button', { name: 'Traduzir 2 páginas' }));
        expect(run).not.toHaveBeenCalled();
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));

        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
        expect(run.mock.calls[0][0]).toMatchObject({ projectId: 'project-1', pageIds: ['p2', 'p3'] });
        expect(await screen.findByText('3 de 4 salvas')).toBeOnTheScreen();
        expect(screen.queryByTestId(/^batch-strip-/)).toBeNull();
        expect(screen.getByRole('progressbar', { name: 'Progresso da tradução' })).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 75 });
    });

    it('shows a loading state below the header while the gateway capabilities are pending', async () => {
        let resolve: (value: Awaited<ReturnType<StartRemoteProcessingController['initialize']>>) => void = () => undefined;
        const slowStart = {
            initialize: jest.fn(() => new Promise(next => (resolve = next))),
        } as unknown as StartRemoteProcessingController;
        render(
            <ChapterBatchPanel
                startController={slowStart}
                batchController={{ run: jest.fn() }}
                headerContent={<Text>Cartão do capítulo</Text>}
                renderLayout={(content, footer) => (
                    <>
                        {content}
                        {footer}
                    </>
                )}
                {...repositories}
            />,
        );

        expect(screen.getByText('Cartão do capítulo')).toBeOnTheScreen();
        expect(await screen.findByTestId('batch-loading')).toHaveProp('accessibilityLabel', 'Verificando o serviço de tradução…');
        expect(screen.queryByRole('checkbox', { name: 'Página 2. aguardando' })).toBeNull();

        await act(async () => resolve({ project, capabilities, attempt: null, error: null } as never));

        expect(await screen.findByRole('checkbox', { name: 'Página 2. aguardando' })).toBeOnTheScreen();
        expect(screen.queryByTestId('batch-loading')).toBeNull();
        expect(screen.getByText('Cartão do capítulo')).toBeOnTheScreen();
    });

    it('keeps the status strip, the summary and the rows on the same per-page statuses', async () => {
        let finish!: () => void;
        const wait = new Promise<void>(resolve => {
            finish = resolve;
        });
        const run = jest.fn<ReturnType<ChapterBatchController['run']>, Parameters<ChapterBatchController['run']>>(async input => {
            await input.onProgress?.({ statuses: { p2: 'processing', p3: 'pending' }, completed: 0, total: 2 });
            await wait;
            input.onProgress?.({ statuses: { p2: 'saved' }, cancelledPageIds: ['p3'], completed: 1, total: 2 });
            return { statuses: { p2: 'saved' }, stoppedBy: null };
        });
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);

        expect(await screen.findByTestId('batch-strip-failed')).toBeOnTheScreen();
        expect(screen.getByText('1 página falhou')).toBeOnTheScreen();
        expect(screen.getByText('1 de 4 salvas')).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Traduzir 2 páginas' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));

        expect(await screen.findByText('Traduzindo a página 2')).toBeOnTheScreen();
        expect(screen.getByText('Mais 1 página na fila')).toBeOnTheScreen();
        expect(screen.getByText('1 de 4 salvas')).toBeOnTheScreen();
        expect(screen.getByRole('checkbox', { name: 'Página 2. processando' })).toBeOnTheScreen();
        expect(screen.getByRole('checkbox', { name: 'Página 3. na fila' })).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Parar após a página atual' }));
        expect(await screen.findByText('Parando após a página 2')).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Parar após a página atual' })).toBeNull();

        finish();
        await waitFor(() => expect(screen.queryByTestId(/^batch-strip-(running|stopping)$/)).toBeNull());
        expect(screen.getByText('2 de 4 salvas')).toBeOnTheScreen();
    });

    it('hides the start button once every page is translated and keeps the reader action', async () => {
        const done: TranslationProject = { ...project, pages: [page('p1', 0, 'READY'), page('p2', 1, 'READY')] };
        const onOpenReader = jest.fn();
        render(
            <ChapterBatchPanel
                startController={{ initialize: jest.fn(async () => ({ project: done, capabilities, attempt: null, error: null })) } as unknown as StartRemoteProcessingController}
                batchController={{ run: jest.fn() }}
                projects={{ ...repositories.projects, getById: jest.fn(async () => done), getLatest: jest.fn(async () => done) }}
                attempts={repositories.attempts}
                onOpenReader={onOpenReader}
            />,
        );

        fireEvent.press(await screen.findByRole('button', { name: 'Abrir leitor' }));
        expect(onOpenReader).toHaveBeenCalledWith('project-1');
        expect(screen.queryByRole('button', { name: /^Traduzir/ })).toBeNull();
    });

    it('does not send anything when the user declines or deselects every page', async () => {
        const run = jest.fn();
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);
        fireEvent.press(await screen.findByRole('checkbox', { name: 'Página 2. aguardando' }));
        fireEvent.press(screen.getByRole('checkbox', { name: 'Página 3. falhou' }));
        expect(screen.getByRole('button', { name: /Traduzir 0/ }).props.accessibilityState.disabled).toBe(true);
        expect(run).not.toHaveBeenCalled();
    });

    it('shows and copies the technical error only in developer mode', async () => {
        useDeveloperMode.setState({ enabled: true, hydrated: true });
        let finish!: () => void;
        const wait = new Promise<void>(resolve => {
            finish = resolve;
        });
        const run = jest.fn<ReturnType<ChapterBatchController['run']>, Parameters<ChapterBatchController['run']>>(async input => {
            await wait;
            input.onProgress?.({ statuses: { p2: 'unknown' }, diagnostics: { p2: 'ocr-unavailable' }, completed: 0, total: 1 });
            return { statuses: { p2: 'unknown' }, stoppedBy: null };
        });
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);
        fireEvent.press(await screen.findByRole('button', { name: 'Traduzir 2 páginas' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
        expect(screen.getByTestId('batch-active-actions')).toHaveStyle({ flexDirection: 'row' });
        expect(screen.getByText('Cancelar agora')).toBeOnTheScreen();
        finish();
        await screen.findByText(/ocr-unavailable/);
        fireEvent.press(screen.getByText('Copiar mensagem'));
        expect(Clipboard.setStringAsync).toHaveBeenCalledWith(expect.stringContaining('ocr-unavailable'));
        await screen.findByText('Mensagem copiada.');
        act(() => useDeveloperMode.setState({ enabled: false, hydrated: false }));
    });

    it('hides technical details in the displayed and copied message when developer mode is disabled', async () => {
        useDeveloperMode.setState({ enabled: false, hydrated: true });
        let finish!: () => void;
        const wait = new Promise<void>(resolve => {
            finish = resolve;
        });
        const run = jest.fn<ReturnType<ChapterBatchController['run']>, Parameters<ChapterBatchController['run']>>(async input => {
            await wait;
            input.onProgress?.({ statuses: { p2: 'unknown' }, diagnostics: { p2: 'ocr-unavailable' }, completed: 0, total: 1 });
            return { statuses: { p2: 'unknown' }, stoppedBy: null };
        });
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);
        fireEvent.press(await screen.findByRole('button', { name: 'Traduzir 2 páginas' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
        finish();
        await screen.findByText('Não foi possível traduzir algumas páginas');
        expect(screen.queryByText(/ocr-unavailable/)).toBeNull();
        fireEvent.press(screen.getByText('Copiar mensagem'));
        await screen.findByText('Mensagem copiada.');
        expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith(expect.not.stringContaining('ocr-unavailable'));
    });
});

describe('MOB-FEAT-067 capabilities retry', () => {
    const unavailableText = 'O processamento remoto está indisponível ou desativado.';
    const unavailable = { project, capabilities: null, attempt: null, error: 'capabilities-unavailable' };
    const ready = { project, capabilities, attempt: null, error: null };
    const startWith = (...results: unknown[]) => {
        const initialize = jest.fn();
        for (const result of results) initialize.mockImplementationOnce(typeof result === 'function' ? (result as () => unknown) : async () => result);
        return { initialize } as unknown as StartRemoteProcessingController & { initialize: jest.Mock };
    };
    const refocus = () =>
        act(() => {
            mockFocus?.();
        });

    beforeEach(async () => {
        mockFocus = null;
        await i18n.changeLanguage('pt-BR');
    });

    it('AC-001 asks the gateway again, keeps the selection and enables translating without opening consent', async () => {
        const start = startWith(unavailable, ready);
        const run = jest.fn();
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);

        expect(await screen.findByText(unavailableText)).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('checkbox', { name: 'Página 2. aguardando' }));
        expect(screen.getByRole('checkbox', { name: 'Página 2. aguardando' }).props.accessibilityState.checked).toBe(false);

        fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

        await waitFor(() => expect(screen.queryByText(unavailableText)).toBeNull());
        expect(start.initialize).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('checkbox', { name: 'Página 2. aguardando' }).props.accessibilityState.checked).toBe(false);
        expect(screen.getByRole('button', { name: 'Traduzir 1 página' })).toBeEnabled();
        expect(screen.queryByRole('button', { name: 'Aceitar e enviar' })).toBeNull();
        expect(run).not.toHaveBeenCalled();
    });

    it('AC-002 hides the action while checking and brings it back when the gateway fails again', async () => {
        let resolve: (value: unknown) => void = () => undefined;
        const start = startWith(unavailable, () => new Promise(next => (resolve = next)));
        render(<ChapterBatchPanel startController={start} batchController={{ run: jest.fn() }} {...repositories} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Tentar novamente' }));

        expect(await screen.findByText('Verificando o serviço de tradução…')).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
        expect(screen.queryByText(unavailableText)).toBeNull();

        await act(async () => resolve(unavailable));

        expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
        expect(screen.getByText(unavailableText)).toBeOnTheScreen();
        expect(start.initialize).toHaveBeenCalledTimes(2);
    });

    it('AC-003 asks again once when the screen regains focus while unavailable', async () => {
        const start = startWith(unavailable, ready);
        render(<ChapterBatchPanel startController={start} batchController={{ run: jest.fn() }} {...repositories} />);
        await screen.findByText(unavailableText);

        refocus(); // first focus is the screen opening
        refocus();

        await waitFor(() => expect(screen.queryByText(unavailableText)).toBeNull());
        expect(start.initialize).toHaveBeenCalledTimes(2);

        const reloads = repositories.projects.getLatest.mock.calls.length;
        refocus();
        await waitFor(() => expect(repositories.projects.getLatest.mock.calls.length).toBeGreaterThan(reloads));
        expect(start.initialize).toHaveBeenCalledTimes(2);
    });

    it('AC-004 offers no retry for the quota limit', async () => {
        const start = startWith({ ...unavailable, error: 'quota-exceeded' });
        render(<ChapterBatchPanel startController={start} batchController={{ run: jest.fn() }} {...repositories} />);

        expect(await screen.findByText('O limite do serviço de tradução foi atingido. As próximas páginas não foram enviadas.')).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
        refocus();
        refocus();
        expect(start.initialize).toHaveBeenCalledTimes(1);
    });

    it('AC-004 offers no retry while an interrupted batch holds the service', async () => {
        const current = backgroundBatchManager.getSnapshot();
        const spy = jest
            .spyOn(backgroundBatchManager, 'getSnapshot')
            .mockReturnValue({ ...current, pausedRun: { projectId: 'other-project', items: [] } as never });
        const start = startWith(unavailable, ready);
        render(<ChapterBatchPanel startController={start} batchController={{ run: jest.fn() }} {...repositories} />);

        expect(await screen.findByText(unavailableText)).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
        refocus();
        refocus();
        expect(start.initialize).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});

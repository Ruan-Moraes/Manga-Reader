import { router } from 'expo-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RemoteProcessingAttempt } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationProject } from '@/entities/translation-project';
import type { AcquireRemoteTranslationResultController } from '@/features/acquire-remote-translation-result';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import { externalLinks } from '@/shared/config';
import i18n from '@/shared/i18n';
import { ROUTES } from '@/shared/navigation';

import { RemoteProcessingPanel } from '../RemoteProcessingPanel';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const project: TranslationProject = {
    id: 'project-1',
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    status: 'DRAFT',
    createdAt: 1,
    updatedAt: 1,
    statusUpdatedAt: 1,
    languageReviewRequired: false,
    pages: [
        {
            id: 'page-1',
            projectId: 'project-1',
            position: 0,
            originalFilename: 'private.jpg',
            originalByteSize: 10,
            originalMimeType: 'image/jpeg',
            widthPx: 10,
            heightPx: 10,
            mediaValidatedAt: 1,
            mediaValidationPolicyVersion: 1,
            status: 'DRAFT',
            createdAt: 1,
            updatedAt: 1,
            statusUpdatedAt: 1,
        },
    ],
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
        languageModelLocation: null,
        contentProcessing: 'in-memory-only',
        resultStorage: 'user-device',
        sanitizedOperationalLogs: true,
        idempotencyKeyFormat: 'uuid-v7',
        receiptValiditySeconds: 604800,
        providerTrainingPolicy: 'No training.',
    },
};

function controller(): jest.Mocked<StartRemoteProcessingController> {
    const value: StartRemoteProcessingController = {
        interrupt: jest.fn(async () => ({ project, capabilities, attempt: null, error: 'submission-unknown' as const })),
        initialize: jest.fn(async (_signal?: AbortSignal) => ({ project, capabilities, attempt: null, error: null })),
        acceptConsent: jest.fn(async (_projectId, _capabilities, _locale) => undefined),
        submit: jest.fn(async (_projectId, _signal?: AbortSignal) => ({ project, capabilities, attempt: null, error: 'submission-unknown' as const })),
        reconcile: jest.fn(async (_signal?: AbortSignal) => ({ project, capabilities, attempt: null, error: null })),
    };
    return value as jest.Mocked<StartRemoteProcessingController>;
}

describe('MOB-FEAT-017 disclosure UI', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('does not consent or submit when the disclosure is opened and declined', async () => {
        const start = controller();
        render(<RemoteProcessingPanel startController={start} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Iniciar processamento' }));
        expect(screen.getByText(/Internet é obrigatória/)).toBeOnTheScreen();
        expect(screen.getByText(/bytes da imagem/)).toHaveTextContent(/texto reconhecido é usado na tradução/);
        expect(screen.getByText(/southamerica-east1/)).toBeOnTheScreen();
        expect(screen.getByText(/OCR usa a região us dos EUA/)).toBeOnTheScreen();
        expect(screen.getByText(/sem garantia de permanência em uma região específica/)).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Abrir política de privacidade' })).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Agora não' }));

        expect(start.acceptConsent).not.toHaveBeenCalled();
        expect(start.submit).not.toHaveBeenCalled();
    });

    it('MOB-FEAT-064 AC-004 opens the capability links and offers a retry when the browser fails', async () => {
        const open = jest.spyOn(externalLinks, 'open').mockRejectedValueOnce(new Error('open-failed')).mockResolvedValue();
        render(<RemoteProcessingPanel startController={controller()} />);
        fireEvent.press(await screen.findByRole('button', { name: 'Iniciar processamento' }));

        fireEvent.press(screen.getByRole('button', { name: 'Abrir política de privacidade' }));
        expect(await screen.findByText('Não foi possível abrir o link.')).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Tentar abrir de novo' }));
        await waitFor(() => expect(screen.queryByText('Não foi possível abrir o link.')).toBeNull());
        expect(open.mock.calls).toEqual([['https://toonlira.com/privacy'], ['https://toonlira.com/privacy']]);
        open.mockRestore();
    });

    it('requires affirmative acceptance before persisting consent and submitting', async () => {
        const start = controller();
        render(<RemoteProcessingPanel startController={start} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Iniciar processamento' }));
        fireEvent.press(screen.getByRole('button', { name: 'Aceitar e enviar' }));

        await waitFor(() => expect(start.acceptConsent).toHaveBeenCalledWith(project.id, capabilities, 'pt-BR'));
        expect(start.submit).toHaveBeenCalledWith(project.id, expect.any(AbortSignal));
    });

    it('does not offer submission when capabilities are unusable', async () => {
        const start = controller();
        start.initialize.mockResolvedValue({ project, capabilities, attempt: null, error: 'capabilities-unavailable' });
        render(<RemoteProcessingPanel startController={start} />);

        await screen.findByText('O processamento remoto está indisponível ou desativado.');
        expect(screen.queryByRole('button', { name: 'Iniciar processamento' })).toBeNull();
        expect(start.submit).not.toHaveBeenCalled();
    });

    it.each([
        ['en-US', 'Start processing', /without a guarantee of remaining in a specific region/],
        ['es-ES', 'Iniciar procesamiento', /sin garantía de permanecer en una región específica/],
    ])('renders an accessible localized action and location disclosure in %s', async (locale, label, location) => {
        await i18n.changeLanguage(locale);
        render(<RemoteProcessingPanel startController={controller()} />);
        fireEvent.press(await screen.findByRole('button', { name: label }));
        expect(screen.getByText(location)).toBeOnTheScreen();
    });
});

const accepted: RemoteProcessingAttempt = {
    id: 'attempt',
    pageId: 'page-1',
    attemptNumber: 1,
    idempotencyKey: 'key',
    gatewayKey: 'gateway-alpha',
    gatewayContractVersion: '2.0',
    volatileReceiptStatus: 'FINISHED',
    status: 'ACCEPTED',
    remoteStatus: 'READY',
    remoteJobRef: 'job',
    errorCode: null,
    createdAt: 1,
    updatedAt: 2,
    submittedAt: 1,
    acceptedAt: 2,
    lastQueriedAt: null,
    cancellationRequestedAt: null,
    cancelledAt: null,
};
it.each([
    ['pt-BR', 'Página salva no aparelho', 'Abrir leitor'],
    ['en-US', 'Page saved on this device', 'Open reader'],
    ['es-ES', 'Página guardada en el dispositivo', 'Abrir lector'],
])('offers an explicit manual reopen after the persistent auto-open claim was consumed in %s', async (locale, title, action) => {
    jest.mocked(router.push).mockClear();
    await i18n.changeLanguage(locale);
    const start = controller();
    const readyProject: TranslationProject = { ...project, status: 'READY', pages: project.pages.map(page => ({ ...page, status: 'READY' })) };
    start.initialize.mockResolvedValue({ project: readyProject, capabilities, attempt: accepted, error: null });
    const acquire: AcquireRemoteTranslationResultController = {
        run: jest.fn(async () => ({ status: 'ready' as const, stage: 1, projectId: project.id, pageId: 'page-1', error: null })),
        claimOpen: jest.fn(async () => false),
    };
    const view = render(<RemoteProcessingPanel startController={start} acquisitionController={acquire} />);
    expect(await screen.findByText(title)).toBeOnTheScreen();
    await waitFor(() => expect(acquire.claimOpen).toHaveBeenCalled());
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: action }));
    expect(router.push).toHaveBeenCalledWith({ pathname: ROUTES.TRANSLATION_READER, params: { projectId: project.id } });
    view.rerender(<RemoteProcessingPanel startController={start} acquisitionController={acquire} />);
    expect(router.push).toHaveBeenCalledTimes(1);
    view.unmount();
});
it('does not offer local reading while remote READY has not been committed locally', async () => {
    await i18n.changeLanguage('pt-BR');
    const start = controller();
    start.initialize.mockResolvedValue({ project: { ...project, status: 'PROCESSING' }, capabilities, attempt: accepted, error: null });
    const acquire: AcquireRemoteTranslationResultController = {
        run: jest.fn(async () => ({ status: 'waiting' as const, stage: 1, projectId: project.id, pageId: 'page-1', error: null })),
        claimOpen: jest.fn(async () => false),
    };
    const view = render(<RemoteProcessingPanel startController={start} acquisitionController={acquire} />);
    await waitFor(() => expect(acquire.run).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Abrir leitor' })).toBeNull();
    expect(screen.queryByText('Página salva no aparelho')).toBeNull();
    view.unmount();
});
it('requires a new explicit confirmation and cost disclosure before processing a failed page again', async () => {
    await i18n.changeLanguage('pt-BR');
    const start = controller();
    const failedProject: TranslationProject = { ...project, status: 'PROCESSING', pages: project.pages.map(page => ({ ...page, status: 'FAILED' })) };
    start.initialize.mockResolvedValue({
        project: failedProject,
        capabilities,
        attempt: { ...accepted, gatewayContractVersion: '2.0', status: 'FAILED', remoteStatus: null },
        error: null,
    });
    render(<RemoteProcessingPanel startController={start} />);
    fireEvent.press(await screen.findByRole('button', { name: 'Iniciar novo processamento' }));
    expect(screen.getByText(/possível novo custo/)).toBeOnTheScreen();
    expect(start.submit).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Agora não' }));
    expect(start.acceptConsent).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Iniciar novo processamento' }));
    fireEvent.press(screen.getByRole('button', { name: 'Aceitar e enviar' }));
    await waitFor(() => expect(start.submit).toHaveBeenCalledWith(project.id, expect.any(AbortSignal)));
    expect(start.acceptConsent).toHaveBeenCalledTimes(1);
});
it('offers an indeterminate response wait and a local interruption while submitting', async () => {
    await i18n.changeLanguage('pt-BR');
    const start = controller();
    const onActivityChange = jest.fn();
    let release!: (value: Awaited<ReturnType<StartRemoteProcessingController['submit']>>) => void;
    start.submit.mockImplementation(
        () =>
            new Promise(resolve => {
                release = resolve;
            }),
    );
    render(<RemoteProcessingPanel startController={start} onActivityChange={onActivityChange} />);
    fireEvent.press(await screen.findByRole('button', { name: 'Iniciar processamento' }));
    fireEvent.press(screen.getByRole('button', { name: 'Aceitar e enviar' }));
    const stop = await screen.findByRole('button', { name: 'Interromper neste aparelho' });
    await waitFor(() => expect(onActivityChange).toHaveBeenCalledWith(true));
    expect(screen.getByRole('button', { name: 'Processando e aguardando resposta' })).toBeDisabled();
    const signal = start.submit.mock.calls[0]![1]!;
    fireEvent.press(stop);
    expect(signal.aborted).toBe(true);
    release({ project, capabilities, attempt: null, error: 'submission-unknown' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Processando e aguardando resposta' })).toBeNull());
    await waitFor(() => expect(onActivityChange).toHaveBeenLastCalledWith(false));
    expect(start.submit).toHaveBeenCalledTimes(1);
});

it.each(['CREATED', 'SUBMITTING', 'CANCEL_PENDING'] as const)(
    'offers an explicit local interruption for restored %s attempts without automatic submission',
    async status => {
        await i18n.changeLanguage('pt-BR');
        const start = controller();
        const restored = { ...accepted, gatewayContractVersion: status === 'CANCEL_PENDING' ? '1.0' : '2.0', status, remoteStatus: null };
        start.initialize.mockResolvedValue({ project, capabilities, attempt: restored, error: null });
        start.reconcile.mockResolvedValue({ project, capabilities, attempt: restored, error: null });
        const cancel = jest.fn(async () => ({ attempt: { ...restored, status: 'FAILED' as const }, error: null }));
        render(<RemoteProcessingPanel startController={start} cancelController={{ cancel }} />);
        fireEvent.press(await screen.findByRole('button', { name: 'Interromper neste aparelho' }));
        await waitFor(() => expect(cancel).toHaveBeenCalledWith(restored));
        expect(start.submit).not.toHaveBeenCalled();
        expect(start.acceptConsent).not.toHaveBeenCalled();
    },
);

it.each(['pt-BR', 'en-US', 'es-ES'] as const)('distinguishes each known receipt from local delivery in %s', async locale => {
    await i18n.changeLanguage(locale);
    for (const status of ['STARTED', 'FINISHED', 'FAILED'] as const) {
        const start = controller();
        start.initialize.mockResolvedValue({
            project,
            capabilities,
            attempt: { ...accepted, gatewayContractVersion: '2.0', status: status === 'STARTED' ? 'UNKNOWN' : 'FAILED', volatileReceiptStatus: status },
            error: null,
        });
        start.reconcile.mockImplementation(async () => start.initialize());
        const view = render(<RemoteProcessingPanel startController={start} />);
        expect(await screen.findByText(i18n.t(`remoteProcessing:volatileReceipt.${status}`))).toBeOnTheScreen();
        expect(screen.queryByText(i18n.t('remoteProcessing:acquisition.ready'))).toBeNull();
        expect(router.push).not.toHaveBeenCalled();
        view.unmount();
    }
});

it('shows only confirmed direct-delivery milestones, without invented remote phases', async () => {
    await i18n.changeLanguage('pt-BR');
    const start = controller();
    start.initialize.mockResolvedValue({ project: { ...project, status: 'PROCESSING' }, capabilities, attempt: accepted, error: null });
    const acquire: AcquireRemoteTranslationResultController = {
        run: jest.fn(async () => ({ status: 'waiting' as const, stage: 0, projectId: project.id, pageId: 'page-1', error: null })),
        claimOpen: jest.fn(async () => false),
    };
    const view = render(<RemoteProcessingPanel startController={start} acquisitionController={acquire} />);
    await waitFor(() => expect(acquire.run).toHaveBeenCalledWith('attempt', expect.any(AbortSignal), expect.any(Function)));
    expect(screen.getByText('Resposta recebida')).toBeOnTheScreen();
    expect(screen.queryByText('Salva no aparelho')).toBeNull();
    expect(screen.queryByText('OCR')).toBeNull();
    expect(screen.queryByText('Renderização')).toBeNull();
    view.unmount();
});

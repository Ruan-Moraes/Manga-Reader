import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationPage } from '@/entities/translation-page';
import type { TranslationProject } from '@/entities/translation-project';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import i18n from '@/shared/i18n';

import type { ChapterBatchController } from '../../model/chapterBatch';
import { PageRetryIndicator } from '../PageRetryIndicator';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

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
    pages: [page('p1', 0, 'READY'), page('p2', 1, 'FAILED'), page('p3', 2, 'FAILED'), page('p4', 3, 'FAILED')],
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
const attemptStatus: Record<string, string> = { p2: 'REJECTED', p3: 'UNKNOWN' };
const repositories = {
    projects: { initialize: jest.fn(async () => undefined), getById: jest.fn(async () => project), getLatest: jest.fn(async () => project) },
    attempts: {
        initialize: jest.fn(async () => undefined),
        getLatestByPage: jest.fn(async (id: string) => (attemptStatus[id] ? { status: attemptStatus[id] } : null) as never),
    },
};

describe('MOB-FEAT-055 page retry indicator', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('shows a discreet accessible failure marker and retries only that page after consent', async () => {
        const run = jest.fn<ReturnType<ChapterBatchController['run']>, Parameters<ChapterBatchController['run']>>(async input => {
            input.onProgress?.({ statuses: { p2: 'saved' }, completed: 1, total: 1 });
            return { statuses: { p2: 'saved' }, stoppedBy: null };
        });
        const onTranslated = jest.fn();
        render(<PageRetryIndicator pageId="p2" startController={start} batchController={{ run }} onTranslated={onTranslated} {...repositories} />);

        const marker = await screen.findByRole('button', { name: /Tradução falhou.*Tentar novamente/ });
        expect(run).not.toHaveBeenCalled();
        fireEvent.press(marker);
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));

        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
        expect(run.mock.calls[0][0].pageIds).toEqual(['p2']);
        await waitFor(() => expect(onTranslated).toHaveBeenCalledTimes(1));
        expect(screen.queryByTestId('page-retry-indicator')).toBeNull();
    });

    it('keeps the original and says so when the retry fails again, without calling onTranslated', async () => {
        const run = jest.fn(async () => ({ statuses: { p2: 'failed' as const }, stoppedBy: null }));
        const onTranslated = jest.fn();
        render(<PageRetryIndicator pageId="p2" startController={start} batchController={{ run }} onTranslated={onTranslated} {...repositories} />);
        fireEvent.press(await screen.findByRole('button', { name: /Tradução falhou/ }));
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));
        expect(screen.getByRole('button', { name: /Tradução falhou.*Tentar novamente/ })).toBeOnTheScreen();
        expect(screen.getByTestId('page-retry-notice')).toHaveStyle({ borderRightWidth: 0, borderLeftWidth: 3 });
        expect(onTranslated).not.toHaveBeenCalled();
    });

    it('offers a first translation for a legacy FAILED flag without a submitted attempt', async () => {
        const run = jest.fn<ReturnType<ChapterBatchController['run']>, Parameters<ChapterBatchController['run']>>(async input => {
            await input.onProgress?.({ statuses: { p2: 'processing' }, completed: 0, total: 1 });
            return { statuses: { p2: 'failed' }, stoppedBy: null };
        });
        const { rerender } = render(<PageRetryIndicator pageId="p2" startController={start} batchController={{ run }} {...repositories} />);
        fireEvent.press(await screen.findByRole('button', { name: /Tradução falhou/ }));
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
        rerender(<PageRetryIndicator pageId="p4" startController={start} batchController={{ run }} {...repositories} />);
        const firstTranslation = await screen.findByRole('button', { name: 'Página não traduzida. Traduzir esta página' });
        expect(firstTranslation).toBeEnabled();
        expect(screen.queryByText('Tradução falhou')).toBeNull();
        fireEvent.press(firstTranslation);
        expect(run).toHaveBeenCalledTimes(1);
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
        expect(run.mock.calls[1][0].pageIds).toEqual(['p4']);
    });

    it('never offers a resend for an uncertain page and hides on translated pages', async () => {
        const run = jest.fn();
        const reconcile = jest.fn(async () => ({ project, capabilities, attempt: null, error: null }));
        const checking = { ...start, reconcile } as unknown as StartRemoteProcessingController;
        const { rerender } = render(<PageRetryIndicator pageId="p3" startController={checking} batchController={{ run }} {...repositories} />);
        const uncertain = await screen.findByRole('button', { name: /Resultado incerto/ });
        // 2026-11-10: tocar só consulta o servidor de novo (recibo); nada é reenviado.
        expect(uncertain.props.accessibilityState.disabled).toBe(false);
        fireEvent.press(uncertain);
        await waitFor(() => expect(reconcile).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole('button', { name: 'Aceitar e enviar' })).toBeNull();
        rerender(<PageRetryIndicator pageId="p1" startController={checking} batchController={{ run }} {...repositories} />);
        await waitFor(() => expect(screen.queryByTestId('page-retry-indicator')).toBeNull());
        expect(run).not.toHaveBeenCalled();
    });
});

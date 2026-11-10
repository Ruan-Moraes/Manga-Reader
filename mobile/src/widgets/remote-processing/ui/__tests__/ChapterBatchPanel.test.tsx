import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationPage } from '@/entities/translation-page';
import type { TranslationProject } from '@/entities/translation-project';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import i18n from '@/shared/i18n';

import type { ChapterBatchController } from '../../model/chapterBatch';
import { ChapterBatchPanel } from '../ChapterBatchPanel';

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
    pages: [page('p1', 0, 'READY'), page('p2', 1, 'DRAFT'), page('p3', 2, 'FAILED'), page('p4', 3, 'FAILED')],
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
        expect(first.props.accessibilityState).toMatchObject({ disabled: true, checked: false });
        expect(screen.getByRole('checkbox', { name: 'Página 4. resultado incerto' }).props.accessibilityState.disabled).toBe(true);
        expect(screen.getByRole('checkbox', { name: 'Página 2. aguardando' }).props.accessibilityState.checked).toBe(true);

        fireEvent.press(screen.getByRole('button', { name: 'Traduzir 2 páginas' }));
        expect(run).not.toHaveBeenCalled();
        fireEvent.press(await screen.findByRole('button', { name: 'Aceitar e enviar' }));

        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
        expect(run.mock.calls[0][0]).toMatchObject({ projectId: 'project-1', pageIds: ['p2', 'p3'] });
        expect(await screen.findByText('Páginas concluídas: 2 de 2')).toBeOnTheScreen();
    });

    it('does not send anything when the user declines or deselects every page', async () => {
        const run = jest.fn();
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);
        fireEvent.press(await screen.findByRole('checkbox', { name: 'Página 2. aguardando' }));
        fireEvent.press(screen.getByRole('checkbox', { name: 'Página 3. aguardando' }));
        expect(screen.getByRole('button', { name: /Traduzir 0/ }).props.accessibilityState.disabled).toBe(true);
        expect(run).not.toHaveBeenCalled();
    });
});

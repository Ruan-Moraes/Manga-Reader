import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationPage } from '@/entities/translation-page';
import type { TranslationProject } from '@/entities/translation-project';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import i18n from '@/shared/i18n';

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

describe('MOB-FEAT-056 lote e consentimento em camadas', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('AC-007 selos de estado por página, selecionar todas e nenhuma', async () => {
        const run = jest.fn();
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);
        await screen.findByRole('checkbox', { name: 'Página 2. aguardando' });
        expect(screen.getByTestId('batch-status-p1')).toHaveProp('accessibilityLabel', 'pronta');
        expect(screen.getByTestId('batch-status-p4')).toHaveProp('accessibilityLabel', 'resultado incerto');
        fireEvent.press(screen.getByRole('button', { name: 'Limpar seleção' }));
        expect(screen.getByRole('button', { name: /Traduzir 0/ })).toBeDisabled();
        fireEvent.press(screen.getByRole('button', { name: 'Selecionar todas' }));
        expect(screen.getByRole('button', { name: 'Traduzir 2 páginas' })).toBeEnabled();
        expect(run).not.toHaveBeenCalled();
    });

    it('AC-011 folha "Antes de enviar" com três itens, detalhes completos e recusa sem envio', async () => {
        const run = jest.fn();
        render(<ChapterBatchPanel startController={start} batchController={{ run }} {...repositories} />);
        fireEvent.press(await screen.findByRole('button', { name: 'Traduzir 2 páginas' }));
        expect(await screen.findByText('Antes de enviar')).toBeOnTheScreen();
        const summary = screen.getByTestId('batch-consent-summary');
        expect(within(summary).getByText(/saem do aparelho/)).toBeOnTheScreen();
        expect(within(summary).getByText(/não guarda imagens nem textos/)).toBeOnTheScreen();
        expect(within(summary).getByText(/não é reenviada sozinha/)).toBeOnTheScreen();
        expect(screen.queryByTestId('batch-consent-details')).toBeNull();
        fireEvent.press(screen.getByRole('button', { name: 'Ver detalhes' }));
        expect(within(screen.getByTestId('batch-consent-details')).getByText(/Toonlira \(privacy@toonlira.com\)/)).toBeOnTheScreen();
        // Política e termos são links no texto, não botões.
        const links = screen.getByTestId('batch-consent-links');
        expect(within(links).getByRole('link', { name: 'política de privacidade' })).toBeOnTheScreen();
        expect(within(links).getByRole('link', { name: 'termos de uso' })).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Abrir política de privacidade' })).toBeNull();
        const declines = screen.getAllByRole('button', { name: 'Agora não' });
        fireEvent.press(declines[declines.length - 1]);
        expect(run).not.toHaveBeenCalled();
    });

    it('AC-006 "Preparar e traduzir" abre o consentimento sozinho, mas só envia depois do aceite', async () => {
        const run = jest.fn(async () => ({ statuses: {}, stoppedBy: null }));
        render(<ChapterBatchPanel requestStart startController={start} batchController={{ run }} {...repositories} />);
        expect(await screen.findByText('Antes de enviar')).toBeOnTheScreen();
        expect(run).not.toHaveBeenCalled();
        fireEvent.press(screen.getByRole('button', { name: 'Aceitar e enviar' }));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    });
});

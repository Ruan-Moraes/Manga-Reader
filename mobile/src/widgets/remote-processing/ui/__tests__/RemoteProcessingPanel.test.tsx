import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationProject } from '@/entities/translation-project';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import i18n from '@/shared/i18n';

import { RemoteProcessingPanel } from '../RemoteProcessingPanel';

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
    contractVersion: '1.0',
    gatewayKey: 'gateway-alpha',
    generatedAt: '2026-09-02T12:00:00.000Z',
    validUntil: '2099-09-02T12:05:00.000Z',
    enabled: true,
    supportedLanguages: ['ja', 'pt-BR'],
    supportedPairs: [{ source: 'ja', target: 'pt-BR' }],
    mediaLimits: { mimeTypes: ['image/jpeg'], maxBytes: 100, maxWidthPx: 100, maxHeightPx: 100, maxPixels: 10_000 },
    dailyInstallationQuota: 20,
    dailyGlobalQuota: 100,
    disclosure: {
        version: 'legal-v1',
        operatorName: 'Toonlira',
        operatorContact: 'privacy@toonlira.com',
        privacyPolicyUrl: 'https://toonlira.com/privacy',
        termsUrl: 'https://toonlira.com/terms',
        gatewayRegion: 'southamerica-east1',
        ocrRegion: 'us',
        translationLocation: 'global',
        languageModelLocation: null,
        originalRetentionSeconds: 3600,
        resultRetentionSeconds: 3600,
        metadataRetentionDays: 7,
        providerTrainingPolicy: 'No training.',
    },
};

function controller(): jest.Mocked<StartRemoteProcessingController> {
    const value: StartRemoteProcessingController = {
        initialize: jest.fn(async (_signal?: AbortSignal) => ({ project, capabilities, attempt: null, error: null })),
        acceptConsent: jest.fn(async (_projectId, _capabilities, _locale) => undefined),
        submit: jest.fn(async (_projectId, _signal?: AbortSignal) => ({ project, capabilities, attempt: null, error: 'submission-unknown' as const })),
        reconcile: jest.fn(async (_signal?: AbortSignal) => ({ project, capabilities, attempt: null, error: null })),
        refresh: jest.fn(async () => ({ project, capabilities, attempt: null, error: null })),
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
        expect(screen.getByText(/bytes da imagem, MIME, dimensões, idiomas/)).toBeOnTheScreen();
        expect(screen.getByText(/southamerica-east1/)).toBeOnTheScreen();
        expect(screen.getByText(/OCR usa a região us dos EUA/)).toBeOnTheScreen();
        expect(screen.getByText(/sem garantia de processamento nos EUA/)).toBeOnTheScreen();
        expect(screen.queryByText(/Gemini/)).toBeNull();
        expect(screen.getByRole('button', { name: 'Abrir política de privacidade' })).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Agora não' }));

        expect(start.acceptConsent).not.toHaveBeenCalled();
        expect(start.submit).not.toHaveBeenCalled();
    });

    it('requires affirmative acceptance before persisting consent and submitting', async () => {
        const start = controller();
        render(<RemoteProcessingPanel startController={start} />);

        fireEvent.press(await screen.findByRole('button', { name: 'Iniciar processamento' }));
        fireEvent.press(screen.getByRole('button', { name: 'Aceitar e enviar' }));

        await waitFor(() => expect(start.acceptConsent).toHaveBeenCalledWith(project.id, capabilities, 'pt-BR'));
        expect(start.submit).toHaveBeenCalledWith(project.id);
    });

    it.each([
        ['pt-BR', 'Iniciar processamento', /revisa o texto lido e a tradução na região us\. Ela recebe só o texto da página, nunca a imagem/],
        ['en-US', 'Start processing', /reviews the recognized text and the translation in the us region\. It receives only the page text, never the image/],
        ['es-ES', 'Iniciar procesamiento', /revisa el texto reconocido y la traducción en la región us\. Solo recibe el texto de la página, nunca la imagen/],
    ])('discloses the language model layer and that it never receives the image in %s', async (locale, label, disclosure) => {
        await i18n.changeLanguage(locale);
        const start = controller();
        const withModel = { ...capabilities, disclosure: { ...capabilities.disclosure, languageModelLocation: 'us' } };
        start.initialize.mockResolvedValue({ project, capabilities: withModel, attempt: null, error: null });
        render(<RemoteProcessingPanel startController={start} />);
        fireEvent.press(await screen.findByRole('button', { name: label }));
        expect(screen.getByText(disclosure)).toBeOnTheScreen();
    });

    it.each([
        ['en-US', 'Start processing', /no guarantee of processing in the US/],
        ['es-ES', 'Iniciar procesamiento', /sin garantía de procesamiento en EE\. UU\./],
    ])('renders an accessible localized action and location disclosure in %s', async (locale, label, location) => {
        await i18n.changeLanguage(locale);
        render(<RemoteProcessingPanel startController={controller()} />);
        fireEvent.press(await screen.findByRole('button', { name: label }));
        expect(screen.getByText(location)).toBeOnTheScreen();
    });
});

describe('MOB-FEAT-021 result follow-up in the panel', () => {
    const accepted = {
        id: 'attempt-1',
        pageId: 'page-1',
        attemptNumber: 1,
        idempotencyKey: 'key',
        gatewayKey: 'gateway-alpha',
        gatewayContractVersion: '1.0',
        status: 'ACCEPTED' as const,
        remoteStatus: 'TRANSLATING' as const,
        remoteJobRef: '30000000-0000-4000-8000-000000000001',
        errorCode: null,
        createdAt: 1,
        updatedAt: 1,
        submittedAt: 1,
        acceptedAt: 1,
        lastQueriedAt: null,
        cancellationRequestedAt: null,
        cancelledAt: null,
        resultAcknowledgedAt: null,
    };

    function acquire(openProjectId: string | null = null) {
        return { sync: jest.fn(async () => ({ active: openProjectId ? 0 : 1, stages: [], openProjectId, error: null })) };
    }

    it.each([
        ['pt-BR', /Tradução\. 3\/5/],
        ['en-US', /Translation\. 3\/5/],
        ['es-ES', /Traducción\. 3\/5/],
    ])('shows the confirmed stage as a five-step bar in %s', async (locale, label) => {
        await i18n.changeLanguage(locale);
        const start = controller();
        const following = { project: { ...project, status: 'PROCESSING' as const }, capabilities, attempt: accepted, error: null };
        start.initialize.mockResolvedValue(following);
        start.refresh.mockResolvedValue(following);
        render(<RemoteProcessingPanel startController={start} acquireController={acquire()} />);
        expect(await screen.findByRole('progressbar', { name: label })).toBeOnTheScreen();
    });

    it('opens the reader once when the follow-up persisted the first result, and offers Read afterwards', async () => {
        await i18n.changeLanguage('pt-BR');
        const start = controller();
        const ready = { ...project, status: 'READY' as const, pages: [{ ...project.pages[0]!, status: 'READY' as const }] };
        start.initialize.mockResolvedValue({ project: { ...project, status: 'PROCESSING' }, capabilities, attempt: accepted, error: null });
        start.refresh.mockResolvedValue({ project: ready, capabilities, attempt: { ...accepted, remoteStatus: 'READY' }, error: null });
        const open = jest.fn();
        render(<RemoteProcessingPanel startController={start} acquireController={acquire('project-1')} onOpenResult={open} />);
        await waitFor(() => expect(open).toHaveBeenCalledWith('project-1'));
        expect(await screen.findByText('Resultado salvo neste aparelho; já pode ser lido sem internet.')).toBeOnTheScreen();
        expect(open).toHaveBeenCalledTimes(1);
        fireEvent.press(screen.getByRole('button', { name: 'Ler tradução' }));
        expect(open).toHaveBeenCalledTimes(2);
        expect(screen.queryByRole('button', { name: 'Cancelar processamento' })).toBeNull();
    });
});

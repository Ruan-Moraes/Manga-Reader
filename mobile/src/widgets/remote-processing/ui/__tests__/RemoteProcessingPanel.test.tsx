import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RemoteProcessingCapabilities } from '@/src/entities/remote-processing-capability';
import type { TranslationProject } from '@/src/entities/translation-project';
import type { StartRemoteProcessingController } from '@/src/features/start-remote-processing';
import i18n from '@/src/shared/i18n';

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
        operatorName: 'Manga Reader',
        operatorContact: 'privacy@mangareader.app',
        privacyPolicyUrl: 'https://mangareader.app/privacy',
        termsUrl: 'https://mangareader.app/terms',
        gatewayRegion: 'southamerica-east1',
        processingRegions: ['us'],
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
        ['en-US', 'Start processing'],
        ['es-ES', 'Iniciar procesamiento'],
    ])('renders an accessible localized action in %s', async (locale, label) => {
        await i18n.changeLanguage(locale);
        render(<RemoteProcessingPanel startController={controller()} />);
        expect(await screen.findByRole('button', { name: label })).toBeEnabled();
    });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import type { TranslationProject } from '@/entities/translation-project';
import i18n from '@/shared/i18n';

import type { CreateTranslationProjectController } from '../../model/createTranslationProject';
import { CreateTranslationProjectPanel } from '../CreateTranslationProjectPanel';

const draft: LocalMediaImportDraft = {
    id: 'project-1',
    createdAt: 1,
    updatedAt: 4,
    confirmedAt: 2,
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
    languagesConfirmedAt: 3,
    items: [
        {
            ...PENDING_MEDIA_VALIDATION,
            id: 'page-1',
            position: 0,
            localFilename: 'page-1.png',
            byteSize: 40,
            mimeHint: 'image/png',
            createdAt: 1,
            mediaValidationStatus: 'VALID',
            detectedMimeType: 'image/png',
            widthPx: 100,
            heightPx: 200,
            validatedAt: 4,
            validationPolicyVersion: 1,
        },
    ],
};

const project: TranslationProject = {
    id: draft.id,
    sourceLanguage: 'zh-Hant',
    targetLanguage: 'en',
    status: 'DRAFT',
    createdAt: 5,
    updatedAt: 5,
    statusUpdatedAt: 5,
    languageReviewRequired: false,
    pages: [
        {
            id: 'page-1',
            projectId: draft.id,
            position: 0,
            originalFilename: 'page-1.png',
            originalByteSize: 40,
            originalMimeType: 'image/png',
            widthPx: 100,
            heightPx: 200,
            mediaValidatedAt: 4,
            mediaValidationPolicyVersion: 1,
            status: 'DRAFT',
            createdAt: 5,
            updatedAt: 5,
            statusUpdatedAt: 5,
        },
    ],
};

describe('MOB-FEAT-016 project UI', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('prepares a ready project and communicates local state without claiming processing', async () => {
        const controller: CreateTranslationProjectController = {
            initialize: jest.fn(async () => null),
            prepare: jest.fn(async () => project),
        };
        const consumed = jest.fn();
        render(<CreateTranslationProjectPanel draft={draft} onDraftConsumed={consumed} controller={controller} />);

        await waitFor(() => expect(screen.getByRole('button', { name: 'Preparar projeto' })).toBeEnabled());
        fireEvent.press(screen.getByRole('button', { name: 'Preparar projeto' }));

        expect(await screen.findByText('Projeto preparado no aparelho')).toBeOnTheScreen();
        expect(screen.getByText('As páginas estão protegidas localmente. O processamento ainda não começou.')).toBeOnTheScreen();
        expect(screen.getByText(/1 página · Chinês tradicional → Inglês · preparado/)).toBeOnTheScreen();
        await waitFor(() => expect(consumed).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(/tradução concluída|100%|ETA/i)).toBeNull();
    });

    it.each(['en-US', 'es-ES'])('renders an accessible action in %s', async locale => {
        await i18n.changeLanguage(locale);
        render(
            <CreateTranslationProjectPanel
                draft={draft}
                onDraftConsumed={jest.fn()}
                controller={{ initialize: jest.fn(async () => null), prepare: jest.fn(async () => project) }}
            />,
        );
        expect(await screen.findByRole('button')).toBeEnabled();
    });
});

it.each([
    ['pt-BR', 'As páginas e os idiomas estão salvos neste aparelho.'],
    ['en-US', 'The pages and language pair are saved on this device.'],
    ['es-ES', 'Las páginas y los idiomas están guardados en este dispositivo.'],
])('does not claim processing has not started for an already READY project in %s', async (locale, description) => {
    await i18n.changeLanguage(locale);
    const ready: TranslationProject = { ...project, status: 'READY', pages: project.pages.map(page => ({ ...page, status: 'READY' })) };
    render(
        <CreateTranslationProjectPanel
            draft={null}
            onDraftConsumed={jest.fn()}
            controller={{ initialize: jest.fn(async () => ready), prepare: jest.fn(async () => ready) }}
        />,
    );
    expect(await screen.findByText(description)).toBeOnTheScreen();
    expect(screen.queryByText(i18n.t('launcher:offline.project.preparedDescription'))).toBeNull();
});

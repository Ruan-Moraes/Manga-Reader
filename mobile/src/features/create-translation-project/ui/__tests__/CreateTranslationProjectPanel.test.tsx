import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import type { TranslationProject } from '@/src/entities/translation-project';
import i18n from '@/src/shared/i18n';

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

        fireEvent.press(await screen.findByRole('button', { name: 'Preparar projeto' }));

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

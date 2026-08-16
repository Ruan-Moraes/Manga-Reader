import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import i18n from '@/src/shared/i18n';

import type { ValidateLocalMediaController } from '../../model/validateLocalMedia';
import { LocalMediaValidationItemStatus, LocalMediaValidationPanel } from '../LocalMediaValidationPanel';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const draft = (overrides: Partial<LocalMediaImportDraft> = {}): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 10,
    confirmedAt: 5,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: 8,
    items: [
        { ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'one', byteSize: 10, mimeHint: null, createdAt: 1 },
        {
            ...PENDING_MEDIA_VALIDATION,
            id: 'item-2',
            position: 1,
            localFilename: 'two',
            byteSize: 20,
            mimeHint: null,
            createdAt: 1,
            mediaValidationStatus: 'INVALID',
            mediaValidationError: 'CORRUPTED',
            validatedAt: 9,
            validationPolicyVersion: 1,
        },
    ],
    ...overrides,
});

describe('MOB-FEAT-015 local media validation UI', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('shows localized page states and validates from the confirmed flow', async () => {
        const current = draft();
        const validated: LocalMediaImportDraft = {
            ...current,
            updatedAt: 12,
            items: current.items.map(item => ({
                ...item,
                mediaValidationStatus: 'VALID',
                mediaValidationError: null,
                detectedMimeType: 'image/png',
                widthPx: 100,
                heightPx: 200,
                validatedAt: 12,
                validationPolicyVersion: 1,
            })),
        };
        const controller: ValidateLocalMediaController = {
            validate: jest.fn(async (_draft, options) => {
                options?.onProgress?.({ completed: 2, total: 2 });
                return validated;
            }),
            reload: jest.fn(async () => current),
        };
        const onDraftChange = jest.fn();
        render(
            <>
                <LocalMediaValidationPanel draft={current} onDraftChange={onDraftChange} controller={controller} />
                {current.items.map(item => (
                    <LocalMediaValidationItemStatus key={item.id} item={item} />
                ))}
            </>,
        );

        expect(screen.getByText('aguardando')).toBeTruthy();
        expect(screen.getByText('inválida')).toBeTruthy();
        expect(screen.getByText('arquivo corrompido')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Tentar páginas inválidas novamente' }));

        await waitFor(() => expect(onDraftChange).toHaveBeenCalledWith(validated));
    });

    it.each(['en-US', 'es-ES'])('renders the validation action in %s', async locale => {
        await i18n.changeLanguage(locale);
        render(
            <LocalMediaValidationPanel
                draft={draft({ items: [draft().items[0]] })}
                onDraftChange={jest.fn()}
                controller={{ validate: jest.fn(), reload: jest.fn() }}
            />,
        );
        expect(screen.getByTestId('local-media-validation')).toBeTruthy();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });
});

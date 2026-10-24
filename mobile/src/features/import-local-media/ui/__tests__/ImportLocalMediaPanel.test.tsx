import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import i18n from '@/shared/i18n';

import { type LocalMediaImportController, LocalMediaImportError, type LocalMediaImportOutcome } from '../../model/importLocalMedia';
import { ImportLocalMediaPanel } from '../ImportLocalMediaPanel';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const draft: LocalMediaImportDraft = {
    id: 'draft-1',
    createdAt: 10,
    updatedAt: 10,
    confirmedAt: null,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: [{ ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: null, createdAt: 10 }],
};

function controller(overrides: Partial<LocalMediaImportController> = {}): LocalMediaImportController {
    return {
        initialize: jest.fn().mockResolvedValue(draft),
        recoverPendingSelection: jest.fn().mockResolvedValue({ status: 'unchanged' }),
        selectImages: jest.fn().mockResolvedValue({ status: 'cancelled' }),
        ...overrides,
    };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe('MOB-FEAT-028 continue with an existing import', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
    });

    it.each([
        ['pt-BR', 'Continuar'],
        ['en-US', 'Continue'],
        ['es-ES', 'Continuar'],
    ])('continues without selecting images or updating the draft in %s', async (language, label) => {
        await i18n.changeLanguage(language);
        const importer = controller();
        const onContinue = jest.fn();
        const onDraftChange = jest.fn();
        render(<ImportLocalMediaPanel controller={importer} onContinue={onContinue} onDraftChange={onDraftChange} />);
        await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());
        onDraftChange.mockClear();

        fireEvent.press(screen.getByRole('button', { name: label }));

        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(importer.selectImages).not.toHaveBeenCalled();
        expect(onDraftChange).not.toHaveBeenCalled();
    });

    it.each([null, { ...draft, items: [] }])('does not offer continuation without any imported pages (%j)', async savedDraft => {
        const importer = controller({ initialize: jest.fn().mockResolvedValue(savedDraft) });
        render(<ImportLocalMediaPanel controller={importer} onContinue={jest.fn()} />);

        await waitFor(() => expect(importer.recoverPendingSelection).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
    });

    it('does not show an action without a continuation handler', async () => {
        render(<ImportLocalMediaPanel controller={controller()} />);
        expect(await screen.findByText('1 imagem importada')).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
    });

    it('disables continuation while restoring an existing selection', async () => {
        const initialization = deferred<LocalMediaImportDraft | null>();
        const importer = controller({ initialize: jest.fn(() => initialization.promise) });
        const onContinue = jest.fn();
        render(<ImportLocalMediaPanel controller={importer} draft={draft} onContinue={onContinue} />);

        expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
        fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
        expect(onContinue).not.toHaveBeenCalled();

        await act(async () => initialization.resolve(draft));
        expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    });

    it.each(['cancelled', 'error'])('blocks continuation during replacement and restores it after %s', async outcome => {
        const selection = deferred<LocalMediaImportOutcome>();
        const importer = controller({ selectImages: jest.fn(() => selection.promise) });
        const onContinue = jest.fn();
        const onDraftChange = jest.fn();
        render(<ImportLocalMediaPanel controller={importer} onContinue={onContinue} onDraftChange={onDraftChange} />);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled());
        onDraftChange.mockClear();

        fireEvent.press(screen.getByRole('button', { name: 'Substituir seleção' }));
        expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
        fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
        expect(onContinue).not.toHaveBeenCalled();

        await act(async () => {
            if (outcome === 'error') selection.reject(new LocalMediaImportError('storage-unavailable'));
            else selection.resolve({ status: 'cancelled' });
        });

        expect(screen.getByText('1 imagem importada')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
        if (outcome === 'error') expect(screen.getByText('Não foi possível guardar as imagens no armazenamento privado.')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(importer.selectImages).toHaveBeenCalledTimes(1);
        expect(onDraftChange).not.toHaveBeenCalled();
    });
});

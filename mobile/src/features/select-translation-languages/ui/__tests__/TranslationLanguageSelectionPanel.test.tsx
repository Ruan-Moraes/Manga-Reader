import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import i18n from '@/src/shared/i18n';

import type { SelectTranslationLanguagesController } from '../../model/selectTranslationLanguages';
import { SelectTranslationLanguagesError } from '../../model/selectTranslationLanguages';
import { TranslationLanguageSelectionPanel } from '../TranslationLanguageSelectionPanel';

jest.mock('@expo/vector-icons', () => {
    const { View: NativeView } = jest.requireActual<typeof import('react-native')>('react-native');

    return { Ionicons: (props: Record<string, unknown>) => <NativeView {...props} /> };
});

const draft = (overrides: Partial<LocalMediaImportDraft> = {}): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 10,
    confirmedAt: 5,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: [{ ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: null, createdAt: 1 }],
    ...overrides,
});

function controller(current = draft(), overrides: Partial<SelectTranslationLanguagesController> = {}): SelectTranslationLanguagesController {
    return {
        update: jest.fn(async (_draft, pair) => ({ ...current, ...pair, updatedAt: 20, languagesConfirmedAt: null })),
        confirm: jest.fn(async selected => ({ ...selected, updatedAt: 30, languagesConfirmedAt: 30 })),
        reload: jest.fn(async () => current),
        ...overrides,
    };
}

describe('MOB-FEAT-014 translation language selection UI', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('shows two fields and opens seven choices only inside the corresponding sheet', () => {
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={jest.fn()} controller={controller()} />);

        expect(screen.queryByText('Escolha os idiomas')).toBeNull();
        expect(screen.getByText('A seleção inicial é uma sugestão. O app ainda não analisou as imagens.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Idioma de origem: Japonês' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Idioma de destino: Português (Brasil)' })).toBeOnTheScreen();
        const direction = screen.UNSAFE_getByProps({ testID: 'translation-language-direction' });
        expect(direction.props.accessibilityElementsHidden).toBe(true);
        expect(direction.props.importantForAccessibility).toBe('no-hide-descendants');
        expect(screen.UNSAFE_getByProps({ testID: 'translation-language-direction-icon' }).props).toEqual(expect.objectContaining({ size: 28 }));
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        expect(screen.queryByText('Recomendado')).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Idioma de origem: Japonês' }));
        expect(screen.getAllByRole('radio')).toHaveLength(7);
        expect(screen.getByRole('radio', { name: 'Japonês' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByText('Chinês simplificado')).toBeOnTheScreen();
        expect(screen.getByText('Chinês tradicional')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('select-field-backdrop'));

        fireEvent.press(screen.getByRole('button', { name: 'Idioma de destino: Português (Brasil)' }));
        expect(screen.getAllByRole('radio')).toHaveLength(7);
        expect(screen.getAllByRole('radio')[0].props.accessibilityLabel).toBe('Português (Brasil)');
        expect(screen.getByRole('radio', { name: 'Português (Brasil)' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByText('Recomendado')).toBeOnTheScreen();
    });

    it('cancels with close, backdrop, escape and native back without saving', () => {
        const languageController = controller();
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={jest.fn()} controller={languageController} />);
        const open = () => fireEvent.press(screen.getByRole('button', { name: 'Idioma de origem: Japonês' }));
        const closed = () => expect(screen.queryAllByRole('radio')).toHaveLength(0);
        open();
        fireEvent.press(screen.getAllByRole('button', { name: 'Fechar seleção' })[1]);
        closed();
        open();
        fireEvent.press(screen.getByTestId('select-field-backdrop'));
        closed();
        open();
        fireEvent(screen.getByTestId('select-field-sheet-layer'), 'accessibilityEscape');
        closed();
        open();
        const openModal = screen.UNSAFE_getAllByType(Modal).find(modal => modal.props.visible);
        act(() => openModal?.props.onRequestClose());
        closed();
        expect(languageController.update).not.toHaveBeenCalled();
        expect(languageController.confirm).not.toHaveBeenCalled();
    });

    it('keeps an equal pair visible, blocks confirmation and persists after the other field is corrected', async () => {
        const languageController = controller();
        const onDraftChange = jest.fn();
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={onDraftChange} controller={languageController} />);

        fireEvent.press(screen.getByRole('button', { name: 'Idioma de destino: Português (Brasil)' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Japonês' }));
        expect(screen.getByText('Origem e destino precisam ser diferentes.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Confirmar idiomas' }).props.accessibilityState.disabled).toBe(true);
        expect(languageController.update).not.toHaveBeenCalled();

        fireEvent.press(screen.getByRole('button', { name: 'Idioma de destino: Japonês' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Inglês' }));
        await waitFor(() => expect(languageController.update).toHaveBeenCalledWith(expect.anything(), { sourceLanguage: 'ja', targetLanguage: 'en' }));
        expect(onDraftChange).toHaveBeenCalled();
    });

    it('persists one field without changing the other and confirms without processing copy', async () => {
        const languageController = controller();
        const onDraftChange = jest.fn();
        const { rerender } = render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={onDraftChange} controller={languageController} />);

        fireEvent.press(screen.getByRole('button', { name: /^Idioma de origem:/ }));
        fireEvent.press(screen.getByRole('radio', { name: 'Coreano' }));
        await waitFor(() => expect(languageController.update).toHaveBeenCalledWith(expect.anything(), { sourceLanguage: 'ko', targetLanguage: 'pt-BR' }));

        const updated = draft({ sourceLanguage: 'ko', updatedAt: 20 });
        rerender(<TranslationLanguageSelectionPanel draft={updated} onDraftChange={onDraftChange} controller={languageController} />);
        fireEvent.press(screen.getByRole('button', { name: 'Confirmar idiomas' }));
        await waitFor(() => expect(languageController.confirm).toHaveBeenCalledWith(updated));
        expect(screen.queryByText(/traduzindo|processando|enviando|sucesso/i)).toBeNull();
    });

    it('restores persisted state and exposes retry after a storage failure', async () => {
        const current = draft({ sourceLanguage: 'es', targetLanguage: 'en' });
        const languageController = controller(current, {
            update: jest.fn().mockRejectedValue(new SelectTranslationLanguagesError('storage-unavailable')),
        });
        render(<TranslationLanguageSelectionPanel draft={current} onDraftChange={jest.fn()} controller={languageController} />);

        fireEvent.press(screen.getByRole('button', { name: /^Idioma de origem:/ }));
        fireEvent.press(screen.getByRole('radio', { name: 'Coreano' }));

        expect(await screen.findByText('Não foi possível salvar os idiomas. O último estado seguro foi restaurado.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
        expect(languageController.reload).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Idioma de origem: Espanhol' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Idioma de destino: Inglês' })).toBeOnTheScreen();
        jest.mocked(languageController.update).mockResolvedValueOnce(draft({ sourceLanguage: 'ko', targetLanguage: 'en' }));
        fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Idioma de origem: Coreano' })).toBeEnabled());
        expect(languageController.update).toHaveBeenCalledTimes(2);
    });

    it('blocks both fields while saving, restores selection on reopen and clears confirmation', async () => {
        const current = draft({ languagesConfirmedAt: 12 });
        let finish!: (value: LocalMediaImportDraft) => void;
        const languageController = controller(current, {
            update: jest.fn(
                () =>
                    new Promise(resolve => {
                        finish = resolve;
                    }),
            ),
        });
        const onDraftChange = jest.fn();
        const { rerender } = render(<TranslationLanguageSelectionPanel draft={current} onDraftChange={onDraftChange} controller={languageController} />);
        expect(screen.getByRole('button', { name: 'Idiomas confirmados' })).toBeDisabled();
        fireEvent.press(screen.getByRole('button', { name: /^Idioma de origem:/ }));
        fireEvent.press(screen.getByRole('radio', { name: 'Coreano' }));
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        expect(screen.getByRole('button', { name: /^Idioma de origem:/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /^Idioma de destino:/ })).toBeDisabled();
        fireEvent.press(screen.getByRole('button', { name: /^Idioma de destino:/ }));
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        const updated = draft({ sourceLanguage: 'ko', updatedAt: 20 });
        await act(async () => finish(updated));
        expect(languageController.update).toHaveBeenCalledTimes(1);
        expect(onDraftChange).toHaveBeenCalledWith(updated);
        rerender(<TranslationLanguageSelectionPanel draft={updated} onDraftChange={onDraftChange} controller={languageController} />);
        expect(screen.getByRole('button', { name: 'Confirmar idiomas' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Idioma de destino: Português (Brasil)' })).toBeEnabled();
        fireEvent.press(screen.getByRole('button', { name: 'Idioma de origem: Coreano' }));
        expect(screen.getByRole('radio', { name: 'Coreano' }).props.accessibilityState.selected).toBe(true);
    });

    it.each([
        ['en-US', 'Choose languages', 'Source language', 'Korean', 'Simplified Chinese', 'Traditional Chinese'],
        ['es-ES', 'Elige los idiomas', 'Idioma de origen', 'Coreano', 'Chino simplificado', 'Chino tradicional'],
    ])('keeps language controls localized and accessible in %s', async (locale, title, source, korean, simplifiedChinese, traditionalChinese) => {
        await i18n.changeLanguage(locale);
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={jest.fn()} controller={controller()} />);

        expect(screen.queryByText(title)).toBeNull();
        fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${source}:`) }));
        expect(screen.getByLabelText(source).props.accessibilityRole).toBe('radiogroup');
        expect(screen.getByText(korean)).toBeOnTheScreen();
        expect(screen.getByText(simplifiedChinese)).toBeOnTheScreen();
        expect(screen.getByText(traditionalChinese)).toBeOnTheScreen();
    });
});

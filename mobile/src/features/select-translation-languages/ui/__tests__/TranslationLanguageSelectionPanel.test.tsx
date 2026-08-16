import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import i18n from '@/src/shared/i18n';

import type { SelectTranslationLanguagesController } from '../../model/selectTranslationLanguages';
import { SelectTranslationLanguagesError } from '../../model/selectTranslationLanguages';
import { TranslationLanguageSelectionPanel } from '../TranslationLanguageSelectionPanel';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

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

    it('shows seven independent source/target choices with honest JA → PT-BR defaults', () => {
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={jest.fn()} controller={controller()} />);

        expect(screen.getByText('Escolha os idiomas')).toBeOnTheScreen();
        expect(screen.getByText(/apenas a sugestão inicial/i)).toBeOnTheScreen();
        expect(screen.getByLabelText('Idioma de origem').props.accessibilityRole).toBe('radiogroup');
        expect(screen.getByLabelText('Idioma de destino').props.accessibilityRole).toBe('radiogroup');
        expect(screen.getAllByRole('radio')).toHaveLength(14);
        expect(screen.getAllByRole('radio', { name: 'Japonês' })[0].props.accessibilityState.selected).toBe(true);
        expect(screen.getByRole('radio', { name: 'Português (Brasil) — recomendado' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getAllByText('Coreano')).toHaveLength(2);
        expect(screen.getAllByText('Chinês simplificado')).toHaveLength(2);
        expect(screen.getAllByText('Chinês tradicional')).toHaveLength(2);
        expect(screen.queryByText(/detectado|provider|modelo|ocr|preço|quota/i)).toBeNull();
    });

    it('keeps an equal pair visible, blocks confirmation and persists after the other field is corrected', async () => {
        const languageController = controller();
        const onDraftChange = jest.fn();
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={onDraftChange} controller={languageController} />);

        fireEvent.press(screen.getAllByRole('radio', { name: 'Japonês' })[1]);
        expect(screen.getByText('Origem e destino precisam ser diferentes.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Confirmar idiomas' }).props.accessibilityState.disabled).toBe(true);
        expect(languageController.update).not.toHaveBeenCalled();

        fireEvent.press(screen.getAllByRole('radio', { name: 'Inglês' })[1]);
        await waitFor(() => expect(languageController.update).toHaveBeenCalledWith(expect.anything(), { sourceLanguage: 'ja', targetLanguage: 'en' }));
        expect(onDraftChange).toHaveBeenCalled();
    });

    it('persists one field without changing the other and confirms without processing copy', async () => {
        const languageController = controller();
        const onDraftChange = jest.fn();
        const { rerender } = render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={onDraftChange} controller={languageController} />);

        fireEvent.press(screen.getAllByRole('radio', { name: 'Coreano' })[0]);
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

        fireEvent.press(screen.getAllByRole('radio', { name: 'Coreano' })[0]);

        expect(await screen.findByText('Não foi possível salvar os idiomas. O último estado seguro foi restaurado.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
        expect(languageController.reload).toHaveBeenCalled();
    });

    it.each([
        ['en-US', 'Choose languages', 'Source language', 'Korean', 'Simplified Chinese', 'Traditional Chinese'],
        ['es-ES', 'Elige los idiomas', 'Idioma de origen', 'Coreano', 'Chino simplificado', 'Chino tradicional'],
    ])('keeps language controls localized and accessible in %s', async (locale, title, source, korean, simplifiedChinese, traditionalChinese) => {
        await i18n.changeLanguage(locale);
        render(<TranslationLanguageSelectionPanel draft={draft()} onDraftChange={jest.fn()} controller={controller()} />);

        expect(screen.getByText(title)).toBeOnTheScreen();
        expect(screen.getByLabelText(source).props.accessibilityRole).toBe('radiogroup');
        expect(screen.getAllByText(korean)).toHaveLength(2);
        expect(screen.getAllByText(simplifiedChinese)).toHaveLength(2);
        expect(screen.getAllByText(traditionalChinese)).toHaveLength(2);
    });
});

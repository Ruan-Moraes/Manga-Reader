import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import i18n from '@/src/shared/i18n';

import type { ReviewLocalMediaImportController } from '../../model/reviewLocalMediaImport';
import { LocalMediaReviewPanel } from '../LocalMediaReviewPanel';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return { Image: ({ accessibilityLabel }: { accessibilityLabel: string }) => React.createElement(View, { accessibilityLabel }) };
});

const draft = (count = 3): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 1,
    confirmedAt: null,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: Array.from({ length: count }, (_, position) => ({
        ...PENDING_MEDIA_VALIDATION,
        id: `item-${position + 1}`,
        position,
        localFilename: `item-${position + 1}`,
        byteSize: position < 2 ? 10 : position + 10,
        mimeHint: position < 2 ? 'image/png' : 'image/jpeg',
        createdAt: 1,
    })),
});

function controller(current = draft()): ReviewLocalMediaImportController {
    return {
        reconcile: jest.fn().mockResolvedValue(undefined),
        itemUri: jest.fn((_draft, item) => `file:///private/draft-1/${item.localFilename}`),
        addImages: jest.fn().mockResolvedValue({ status: 'unchanged', draft: current }),
        removeItem: jest.fn().mockResolvedValue({ status: 'updated', draft: current }),
        moveItem: jest.fn().mockImplementation(async (_draft, itemId, offset) => {
            const items = [...current.items];
            const index = items.findIndex(item => item.id === itemId);
            [items[index], items[index + offset]] = [items[index + offset], items[index]];
            return { status: 'updated', draft: { ...current, items: items.map((item, position) => ({ ...item, position })) } };
        }),
        confirm: jest.fn().mockResolvedValue({ status: 'updated', draft: { ...current, confirmedAt: 20 } }),
        reload: jest.fn().mockResolvedValue(current),
    };
}

describe('MOB-FEAT-013 local media review UI', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('renders private thumbnails, positions, duplicate warnings and accessible controls', async () => {
        const reviewer = controller();
        const onDraftChange = jest.fn();
        render(<LocalMediaReviewPanel draft={draft()} controller={reviewer} onDraftChange={onDraftChange} />);

        expect(screen.getByTestId('local-media-review-list-kanban')).toBeOnTheScreen();
        expect(screen.getByText('Página 1 de 3')).toBeOnTheScreen();
        expect(screen.getAllByText('Possível duplicata — confira antes de continuar')).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Ampliar página 1 de 3' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Mover página 1 para antes' }).props.accessibilityState.disabled).toBe(true);
        expect(screen.getByRole('button', { name: 'Mover página 3 para depois' }).props.accessibilityState.disabled).toBe(true);
        expect(screen.getByRole('button', { name: 'Remover página 1' })).toHaveTextContent('Excluir');

        fireEvent.press(screen.getByRole('button', { name: 'Mover página 1 para depois' }));
        await waitFor(() => expect(reviewer.moveItem).toHaveBeenCalledWith(expect.anything(), 'item-1', 1));
        expect(onDraftChange).toHaveBeenCalled();
        expect(screen.queryByText(/idioma de origem|traduzir agora|processando/i)).toBeNull();
    });

    it('uses bounded FlatList rendering for a 100-image draft', () => {
        const largeDraft = draft(100);
        render(<LocalMediaReviewPanel draft={largeDraft} controller={controller(largeDraft)} onDraftChange={jest.fn()} />);

        const list = screen.getByTestId('local-media-review-list-kanban');
        expect(list.props.initialNumToRender).toBe(8);
        expect(list.props.maxToRenderPerBatch).toBe(8);
        expect(list.props.windowSize).toBe(5);
        expect(list.props.removeClippedSubviews).toBe(true);
        expect(list.props.style).toEqual(expect.objectContaining({ flex: 1, minHeight: 0 }));
        expect(list.props.ListFooterComponent).toBeTruthy();
        expect(screen.getByTestId('local-media-review-footer')).toBeOnTheScreen();
    });

    it('defaults to kanban and switches to scroll without changing the draft order', () => {
        render(<LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={jest.fn()} />);

        expect(screen.getByRole('button', { name: 'Kanban' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByRole('button', { name: 'Scroll' }).props.accessibilityState.selected).toBe(false);
        expect(screen.getByTestId('local-media-review-list-kanban')).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Scroll' }));

        expect(screen.getByRole('button', { name: 'Scroll' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByTestId('local-media-review-list-scroll').props.initialNumToRender).toBe(6);
        expect(screen.getByText('Página 1 de 3')).toBeOnTheScreen();
        expect(screen.getByText('Página 3 de 3')).toBeOnTheScreen();
    });

    it('opens a private expanded preview and closes it without mutating the draft', () => {
        const onDraftChange = jest.fn();
        render(<LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={onDraftChange} />);

        fireEvent.press(screen.getByRole('button', { name: 'Ampliar página 2 de 3' }));

        expect(screen.getByTestId('local-media-preview-modal')).toBeOnTheScreen();
        expect(screen.getByText('Visualizando página 2 de 3')).toBeOnTheScreen();
        expect(screen.getByLabelText('Imagem ampliada da página 2 de 3')).toBeOnTheScreen();
        expect(screen.queryByText(/file:\/\/|item-2/)).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

        expect(screen.queryByTestId('local-media-preview-modal')).toBeNull();
        expect(onDraftChange).not.toHaveBeenCalled();

        fireEvent.press(screen.getByRole('button', { name: 'Ampliar página 2 de 3' }));
        fireEvent(screen.getByTestId('local-media-preview-modal'), 'requestClose');
        expect(screen.queryByTestId('local-media-preview-modal')).toBeNull();
    });

    it.each([
        ['en-US', 'Add images', 'Confirm order', 'Scroll', 'Delete'],
        ['es-ES', 'Añadir imágenes', 'Confirmar orden', 'Scroll', 'Eliminar'],
    ])('keeps review actions localized and accessible in %s', async (language, add, confirm, list, remove) => {
        await i18n.changeLanguage(language);
        render(<LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={jest.fn()} />);
        expect(screen.getByRole('button', { name: add })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: confirm })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: list })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /remove page 1|eliminar la página 1/i })).toHaveTextContent(remove);
    });
});

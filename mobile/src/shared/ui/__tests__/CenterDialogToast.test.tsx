import { Keyboard, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { BottomSheet } from '../BottomSheet';
import { CenterDialog } from '../CenterDialog';
import { ConfirmDialog } from '../ConfirmSheet';
import { showToast, TOAST_DURATION_MS, ToastHost, useToastStore } from '../toast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const withTheme = (node: React.ReactElement) => render(<ThemeProvider waitForPlatform={false}>{node}</ThemeProvider>);

describe('diálogo central, confirmação, notificação e teclado (2026-11-10)', () => {
    afterEach(() => {
        jest.useRealTimers();
        act(() => useToastStore.getState().dismiss());
    });

    it('centraliza o cartão, fecha pelo fundo e pelo gesto de escape sem confirmar', () => {
        const onClose = jest.fn();
        withTheme(
            <CenterDialog visible onClose={onClose} closeLabel="Fechar" title="Título" description="Descrição" icon="cloud-upload-outline">
                <Text>corpo</Text>
            </CenterDialog>,
        );
        expect(screen.getByTestId('center-dialog-layer')).toHaveStyle({ justifyContent: 'center', alignItems: 'center' });
        expect(screen.getByTestId('center-dialog')).toHaveStyle({ maxWidth: 400 });
        expect(screen.getByRole('header', { name: 'Título' })).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('center-dialog-backdrop'));
        fireEvent(screen.getByTestId('center-dialog-layer'), 'accessibilityEscape');
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('confirmação mostra o que sai e o que fica, e só o botão de confirmar confirma', () => {
        const onConfirm = jest.fn();
        const onClose = jest.fn();
        withTheme(
            <ConfirmDialog
                visible
                onClose={onClose}
                onConfirm={onConfirm}
                closeLabel="Fechar"
                cancelLabel="Cancelar"
                confirmLabel="Excluir"
                title="Excluir?"
                itemsTitle="Remove"
                items={['páginas']}
                preservedTitle="Preserva"
                preservedItems={['preferências']}
            />,
        );
        expect(screen.getByTestId('confirm-sheet-items')).toHaveTextContent(/páginas/);
        expect(screen.getByTestId('confirm-sheet-preserved')).toHaveTextContent(/preferências/);
        fireEvent.press(screen.getByTestId('confirm-sheet-cancel'));
        expect(onConfirm).not.toHaveBeenCalled();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('notificação aparece por cima da tela e some sozinha', () => {
        jest.useFakeTimers();
        withTheme(<ToastHost />);
        act(() => showToast({ tone: 'success', title: 'Cache limpo', description: 'Pronto.' }));
        expect(screen.getByTestId('toast')).toHaveProp('accessibilityLabel', 'Cache limpo. Pronto.');
        act(() => jest.advanceTimersByTime(TOAST_DURATION_MS + 10));
        expect(screen.queryByTestId('toast')).toBeNull();
    });

    it('folha sobe acima do teclado quando ele cobre a camada', () => {
        const listeners: Record<string, (event: unknown) => void> = {};
        jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, callback: (event: unknown) => void) => {
            listeners[name] = callback;
            return { remove: jest.fn() };
        }) as never);
        withTheme(
            <BottomSheet visible onClose={jest.fn()} closeLabel="Fechar" footer={<Text>ação</Text>}>
                <Text>campo</Text>
            </BottomSheet>,
        );
        fireEvent(screen.getByTestId('bottom-sheet-layer'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } });
        const show = listeners.keyboardWillShow ?? listeners.keyboardDidShow;
        act(() => show({ endCoordinates: { screenY: 544, height: 300 } }));
        expect(screen.getByTestId('bottom-sheet')).toHaveStyle({ bottom: 300 });
        jest.restoreAllMocks();
    });
});

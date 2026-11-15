import { Keyboard, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { MOTION_DURATIONS, ThemeProvider } from '@/shared/theme';

import { BottomSheet } from '../BottomSheet';
import { CenterDialog } from '../CenterDialog';
import { ConfirmDialog } from '../ConfirmSheet';
import { showToast, TOAST_DURATION_MS, ToastHost, useToastStore } from '../toast';
import { shouldDismissSwipe } from '../toast/ToastHost';

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
        // A confirmação não separa o cabeçalho da lista com linha (2026-11-14).
        expect(screen.getByTestId('center-dialog-header')).toHaveStyle({ borderBottomWidth: 0 });
        fireEvent.press(screen.getByTestId('confirm-sheet-cancel'));
        expect(onConfirm).not.toHaveBeenCalled();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('divisória do cabeçalho só aparece quando há conteúdo antes das ações (2026-11-14)', () => {
        const view = withTheme(<CenterDialog visible onClose={jest.fn()} closeLabel="Fechar" title="Título" description="Descrição" />);
        expect(screen.getByTestId('center-dialog-header')).toHaveStyle({ borderBottomWidth: 0 });
        view.rerender(
            <ThemeProvider waitForPlatform={false}>
                <CenterDialog visible onClose={jest.fn()} closeLabel="Fechar" title="Título">
                    <Text>corpo</Text>
                </CenterDialog>
            </ThemeProvider>,
        );
        expect(screen.getByTestId('center-dialog-header')).toHaveStyle({ borderBottomWidth: 1 });
    });

    it('cancelar da confirmação é neutro e não disputa com a ação principal (2026-11-14)', () => {
        withTheme(
            <ConfirmDialog visible onClose={jest.fn()} onConfirm={jest.fn()} closeLabel="Fechar" cancelLabel="Manter" confirmLabel="Limpar" title="Limpar?" />,
        );
        const cancel = screen.getByTestId('confirm-sheet-cancel');
        expect(cancel).toHaveStyle({ borderWidth: 1 });
        expect(['#C9C3B5', '#3A3932']).toContain(StyleSheet.flatten(cancel.props.style).borderColor);
    });

    it('arrastar a notificação para a direita a dispensa só com distância ou velocidade suficientes (2026-11-14)', () => {
        expect(shouldDismissSwipe(150, 0, 300)).toBe(true);
        expect(shouldDismissSwipe(60, 0, 300)).toBe(false);
        expect(shouldDismissSwipe(40, 0.9, 300)).toBe(true);
        expect(shouldDismissSwipe(-40, 0.9, 300)).toBe(false);
    });

    it('notificação aparece por cima da tela e some sozinha', () => {
        jest.useFakeTimers();
        withTheme(<ToastHost />);
        act(() => showToast({ tone: 'success', title: 'Cache limpo', description: 'Pronto.' }));
        expect(screen.getByTestId('toast-layer')).toHaveStyle({ alignItems: 'flex-end', right: 0 });
        expect(screen.getByTestId('toast')).toHaveProp('accessibilityLabel', 'Cache limpo. Pronto.');
        act(() => jest.advanceTimersByTime(TOAST_DURATION_MS + 10));
        // Sai animada: continua na tela, sem receber toques, até a animação de saída terminar.
        expect(screen.getByTestId('toast')).toBeOnTheScreen();
        expect(screen.getByTestId('toast-layer')).toHaveProp('pointerEvents', 'none');
        act(() => jest.advanceTimersByTime(MOTION_DURATIONS.exit + 50));
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

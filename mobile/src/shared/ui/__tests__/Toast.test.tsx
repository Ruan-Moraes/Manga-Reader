import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { Toast } from '../Toast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 34 } };

function toast(props: Partial<Parameters<typeof Toast>[0]> = {}) {
    return (
        <SafeAreaProvider initialMetrics={metrics}>
            <ThemeProvider waitForPlatform={false}>
                <Toast title="Título" description="Descrição" {...props} />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

describe('MOB-FEAT-024 app toast (port of the web toast)', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('docks to the bottom right, above the safe area, no wider than the web toast', () => {
        render(toast());
        const dock = screen.getByTestId('toast-dock');
        const style = Array.isArray(dock.props.style) ? Object.assign({}, ...dock.props.style) : dock.props.style;
        expect(style).toMatchObject({ position: 'absolute', right: 16, bottom: 34 + 16 });
        expect(style.width).toBeLessThanOrEqual(360);
        expect(screen.getByText('Título')).toBeOnTheScreen();
        expect(screen.getByText('Descrição')).toBeOnTheScreen();
    });

    it('with position top docks to the top right, below the safe area', () => {
        render(toast({ position: 'top' }));
        const dock = screen.getByTestId('toast-dock');
        const style = Array.isArray(dock.props.style) ? Object.assign({}, ...dock.props.style) : dock.props.style;
        expect(style).toMatchObject({ position: 'absolute', right: 16, top: 16 });
        expect(style.bottom).toBeUndefined();
    });

    it('dismisses itself after its duration, and through the dismiss button', () => {
        jest.useFakeTimers();
        try {
            const onDismiss = jest.fn();
            render(toast({ onDismiss, duration: 4000 }));
            fireEvent.press(screen.getByLabelText('Dispensar'));
            expect(onDismiss).toHaveBeenCalledTimes(1);
            act(() => {
                jest.advanceTimersByTime(4000);
            });
            expect(onDismiss).toHaveBeenCalledTimes(2);
        } finally {
            jest.useRealTimers();
        }
    });

    it('with duration 0 stays until dismissed', () => {
        jest.useFakeTimers();
        try {
            const onDismiss = jest.fn();
            render(toast({ onDismiss, duration: 0, icon: 'progress' }));
            act(() => {
                jest.advanceTimersByTime(60_000);
            });
            expect(onDismiss).not.toHaveBeenCalled();
        } finally {
            jest.useRealTimers();
        }
    });
});

import { act } from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { ZoomableSurface } from '../ZoomableSurface';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

function renderSurface(resetKey = 'a') {
    const view = (key: string) => (
        <ThemeProvider waitForPlatform={false}>
            <ZoomableSurface resetKey={key} bottomInset={0}>
                <Text>page</Text>
            </ZoomableSurface>
        </ThemeProvider>
    );
    const rendered = render(view(resetKey));
    fireEvent(rendered.getByTestId('reader-zoom-root'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } } });
    return { ...rendered, change: (key: string) => rendered.rerender(view(key)) };
}
const pinch = (scale: number) =>
    act(() => {
        fireGestureHandler(getByGestureTestId('reader-zoom-pinch'), [
            { state: State.BEGAN, scale: 1, focalX: 200, focalY: 400 },
            { state: State.ACTIVE, scale, focalX: 200, focalY: 400 },
            { state: State.ACTIVE, scale, focalX: 200, focalY: 400 },
            { state: State.END, scale, focalX: 200, focalY: 400 },
        ]);
    });

describe('MOB-FEAT-055/AC-007 reader zoom', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('stays untouched and exposes no reset until the user pinches', () => {
        renderSurface();
        expect(screen.queryByTestId('reader-zoom-reset')).toBeNull();
        expect(screen.getByTestId('reader-zoom-content').props.pointerEvents).toBe('auto');
    });

    it('zooms with a pinch, keeps proportions, blocks inner scroll and resets from the accessible action', () => {
        renderSurface();
        pinch(2);
        const content = screen.getByTestId('reader-zoom-content');
        expect(content.props.pointerEvents).toBe('none');
        expect(content).toHaveStyle({ transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 2 }] });
        fireEvent.press(screen.getByRole('button', { name: 'Restaurar tamanho original' }));
        expect(screen.queryByTestId('reader-zoom-reset')).toBeNull();
        expect(screen.getByTestId('reader-zoom-content')).toHaveStyle({ transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] });
    });

    it('pans only while zoomed and clamps at the edges', async () => {
        renderSurface();
        pinch(2);
        await act(async () => undefined);
        act(() => {
            fireGestureHandler(getByGestureTestId('reader-zoom-pan'), [
                { state: State.BEGAN, translationX: 0, translationY: 0 },
                { state: State.ACTIVE, translationX: 5000, translationY: -30 },
                { state: State.ACTIVE, translationX: 5000, translationY: -30 },
                { state: State.END, translationX: 5000, translationY: -30 },
            ]);
        });
        expect(screen.getByTestId('reader-zoom-content')).toHaveStyle({ transform: [{ translateX: 200 }, { translateY: -30 }, { scale: 2 }] });
    });

    it('restores the scale when the page changes', () => {
        const { change } = renderSurface('page-1');
        pinch(3);
        expect(screen.getByTestId('reader-zoom-reset')).toBeOnTheScreen();
        change('page-2');
        expect(screen.queryByTestId('reader-zoom-reset')).toBeNull();
    });
});

import { Animated } from 'react-native';
import { Image } from 'expo-image';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import type { ImageReaderItem } from '../../model/contentReader';
import { ImageSurface, TRANSLATION_FADE_MS } from '../ImageSurface';

jest.mock('react-native-reanimated', () => ({ ...jest.requireActual('react-native-reanimated'), useReducedMotion: jest.fn(() => false) }));

const pending: ImageReaderItem = {
    id: 'page-1',
    primaryUri: 'file:///original.jpg',
    originalUri: 'file:///original.jpg',
    width: 800,
    height: 1200,
    pending: true,
};
const translated: ImageReaderItem = { ...pending, primaryUri: 'file:///translated.webp', pending: false };

function surface(item: ImageReaderItem, showOriginal = false) {
    return (
        <ThemeProvider waitForPlatform={false}>
            <ImageSurface
                item={item}
                height={600}
                width={400}
                showOriginal={showOriginal}
                showDemoOverlay={false}
                integrity="valid"
                saturation={100}
                onRetry={jest.fn()}
            />
        </ThemeProvider>
    );
}

const imageOf = (uri: string) => screen.UNSAFE_getAllByType(Image).find(image => image.props.source?.uri === uri)!;
const opacityOf = () => {
    const style = screen.getByTestId('reader-image-page-1').props.style;
    return (Array.isArray(style) ? Object.assign({}, ...style) : style).opacity;
};

describe('MOB-FEAT-024 translation progress on a page', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
        jest.mocked(useReducedMotion).mockReturnValue(false);
    });

    it('AC-001: a page still being translated shows its original with no badge over the image', () => {
        render(surface(pending));
        expect(imageOf('file:///original.jpg')).toBeTruthy();
        expect(screen.queryByTestId('reader-translating-badge')).toBeNull();
    });

    it('AC-002: the translation fades in over the original once it has loaded, and the original then goes away', () => {
        jest.useFakeTimers();
        try {
            const view = render(surface(pending));
            view.rerender(surface(translated));
            // The original stays underneath while the translation is still invisible.
            expect(screen.getByTestId('reader-underlay-page-1')).toBeOnTheScreen();
            expect(opacityOf()).toBe(0);
            const timing = jest.spyOn(Animated, 'timing');
            fireEvent(imageOf('file:///translated.webp'), 'load');
            expect(timing).toHaveBeenCalledWith(expect.anything(), { toValue: 1, duration: TRANSLATION_FADE_MS, useNativeDriver: true });
            act(() => {
                jest.advanceTimersByTime(TRANSLATION_FADE_MS + 100);
            });
            // Faded in: the original underneath goes away.
            expect(screen.queryByTestId('reader-underlay-page-1')).toBeNull();
            timing.mockRestore();
        } finally {
            jest.useRealTimers();
        }
    });

    it('AC-002: with reduced motion the translation replaces the original at once', () => {
        jest.mocked(useReducedMotion).mockReturnValue(true);
        const view = render(surface(pending));
        view.rerender(surface(translated));
        fireEvent(imageOf('file:///translated.webp'), 'load');
        expect(opacityOf()).toBe(1);
        expect(screen.queryByTestId('reader-underlay-page-1')).toBeNull();
    });

    it('AC-002: a page that opens already translated does not animate', () => {
        render(surface(translated));
        expect(opacityOf()).toBe(1);
    });
});

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/shared/theme';
import { IconButton } from '@/shared/ui';

import { isZoomed, panBy, ZOOM_RESET, zoomAround, type ZoomState } from '../model/zoom';

interface Props {
    children: ReactNode;
    /** Changing key (page/document) restores the original scale. */
    resetKey: string;
    bottomInset: number;
}

/**
 * Pinch to zoom, pan while zoomed and a visible reset action. At scale 1 every touch reaches the
 * reader (scroll, tap and swipe); while zoomed the content is inert so panning cannot also scroll.
 */
export function ZoomableSurface({ children, resetKey, bottomInset }: Props) {
    const { t } = useTranslation('reader');
    const { spacing, tokens } = useTheme();
    const [zoom, setZoom] = useState<ZoomState>(ZOOM_RESET);
    const size = useRef({ width: 1, height: 1 });
    const start = useRef<ZoomState>(ZOOM_RESET);
    const current = useRef<ZoomState>(ZOOM_RESET);
    const apply = useCallback((next: ZoomState) => {
        current.current = next;
        setZoom(next);
    }, []);
    const zoomed = isZoomed(zoom);

    useEffect(() => apply(ZOOM_RESET), [apply, resetKey]);

    const pinch = Gesture.Pinch()
        .withTestId('reader-zoom-pinch')
        .runOnJS(true)
        .onBegin(() => {
            start.current = current.current;
        })
        .onUpdate(event =>
            apply(
                zoomAround(
                    start.current,
                    start.current.scale * event.scale,
                    { x: event.focalX - size.current.width / 2, y: event.focalY - size.current.height / 2 },
                    size.current,
                ),
            ),
        );
    const pan = Gesture.Pan()
        .withTestId('reader-zoom-pan')
        .runOnJS(true)
        .enabled(zoomed)
        .minPointers(1)
        .onBegin(() => {
            start.current = current.current;
        })
        .onUpdate(event => apply(panBy(start.current, { x: event.translationX, y: event.translationY }, size.current)));

    return (
        <View testID="reader-zoom-root" style={{ flex: 1 }} onLayout={event => (size.current = event.nativeEvent.layout)}>
            <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
                <View style={{ flex: 1, overflow: 'hidden' }}>
                    <View
                        testID="reader-zoom-content"
                        pointerEvents={zoomed ? 'none' : 'auto'}
                        style={{ flex: 1, transform: [{ translateX: zoom.x }, { translateY: zoom.y }, { scale: zoom.scale }] }}
                    >
                        {children}
                    </View>
                </View>
            </GestureDetector>
            {zoomed ? (
                <View
                    testID="reader-zoom-reset"
                    style={{ backgroundColor: tokens.surface, borderRadius: 12, bottom: bottomInset + spacing.md, position: 'absolute', right: spacing.md }}
                >
                    <IconButton accessibilityLabel={t('actions.resetZoom')} icon="contract-outline" onPress={() => apply(ZOOM_RESET)} />
                </View>
            ) : null}
        </View>
    );
}

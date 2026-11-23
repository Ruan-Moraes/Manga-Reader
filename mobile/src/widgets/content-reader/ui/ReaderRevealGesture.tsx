import { useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { READER_GESTURE_LIMITS, validRevealSwipe } from '../model/readerInteraction';

export function ReaderRevealGesture({ bottom, targetSize, blocked, onReveal }: { bottom: number; targetSize: number; blocked(): boolean; onReveal(): void }) {
    const start = useRef(0);
    const rejected = useRef(false);
    const gesture = Gesture.Pan()
        .withTestId('reader-reveal-pan')
        .runOnJS(true)
        .minDistance(1)
        .maxPointers(1)
        .onBegin(() => {
            start.current = Date.now();
            rejected.current = blocked();
        })
        .onUpdate(event => {
            if (Math.abs(event.translationX) > READER_GESTURE_LIMITS.swipeHorizontal || event.numberOfPointers !== 1 || blocked()) rejected.current = true;
        })
        .onEnd((event, success) => {
            if (success && !rejected.current && !blocked() && validRevealSwipe(event.translationX, event.translationY, Date.now() - start.current)) onReveal();
        });
    return (
        <GestureDetector gesture={gesture}>
            <View
                testID="reader-reveal-region"
                accessible={false}
                style={{ position: 'absolute', alignSelf: 'center', bottom, width: targetSize * 2, height: targetSize }}
            />
        </GestureDetector>
    );
}

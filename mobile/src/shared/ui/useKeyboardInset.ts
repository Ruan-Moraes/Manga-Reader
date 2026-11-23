import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent, type LayoutChangeEvent, Platform } from 'react-native';

/** Screen Y of the keyboard's top edge while it is open, `null` while closed. */
export function useKeyboardTop(): number | null {
    const [top, setTop] = useState<number | null>(null);

    useEffect(() => {
        // iOS moves with the keyboard through the "will" events; Android only has the "did" events.
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const onShow = (event: KeyboardEvent) => {
            const screenY = event.endCoordinates?.screenY;
            setTop(typeof screenY === 'number' && Number.isFinite(screenY) ? screenY : null);
        };
        const onHide = () => setTop(null);
        const show = Keyboard.addListener(showEvent, onShow);
        const hide = Keyboard.addListener(hideEvent, onHide);
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    return top;
}

/**
 * How much of a full-screen modal layer the keyboard covers (0 when closed). Modals render outside the screen's
 * KeyboardAvoidingView, so sheets and dialogs lift their own content by this amount. Measuring the layer instead of
 * trusting the keyboard height keeps it right when the platform already resized the window (Android adjustResize):
 * then the layer ends above the keyboard and the overlap is 0.
 */
export function useKeyboardOverlap(): { overlap: number; onLayerLayout: (event: LayoutChangeEvent) => void } {
    const keyboardTop = useKeyboardTop();
    const [layerBottom, setLayerBottom] = useState(0);
    const onLayerLayout = (event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        setLayerBottom(y + height);
    };
    return { overlap: keyboardTop === null ? 0 : Math.max(0, layerBottom - keyboardTop), onLayerLayout };
}

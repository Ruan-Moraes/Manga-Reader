import { type ReactElement, useState } from 'react';
import { AppState, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { scrollTo } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { REVIEW_DRAG_LONG_PRESS_MS } from '../../config/reviewLayout';
import type { ReviewLocalMediaImportController, ReviewLocalMediaImportOutcome } from '../../model/reviewLocalMediaImport';
import { reorderReviewItems, resolveReviewColumnCount, resolveReviewDropIndex, resolveReviewItemShift } from '../../model/reviewSortGeometry';
import { LocalMediaReviewPanel } from '../LocalMediaReviewPanel';

let mockDeferSettling = false;
let mockScrollOffset = 0;
let mockRejectLanding = false;
let mockMissingNativeRef = false;
const mockAnimationCallbacks: Array<(finished: boolean) => void> = [];
const mockFrameCallbacks = new Set<(frame: { timeSincePreviousFrame: number }) => void>();

jest.mock('@expo/vector-icons', () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return { Ionicons: (props: Record<string, unknown>) => React.createElement(View, { ...props, testID: `icon-${props.name}` }) };
});
jest.mock('react-native-worklets', () => ({
    scheduleOnRN: jest.fn((callback, ...args) => callback(...args)),
    scheduleOnUI: (callback: (...args: unknown[]) => unknown, ...args: unknown[]) => callback(...args),
}));
jest.mock('expo-image', () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return { Image: ({ accessibilityLabel }: { accessibilityLabel: string }) => React.createElement(View, { accessibilityLabel }) };
});
jest.mock('react-native-reanimated', () => {
    const React = jest.requireActual('react');
    const { FlatList, View } = jest.requireActual('react-native');
    // Reanimated 4.1 forwards refs when the native child attaches, not when a new ref prop arrives.
    const AnimatedView = React.forwardRef((props: Record<string, unknown>, forwardedRef: unknown) => {
        const initialRef = React.useRef(forwardedRef);
        const attach = React.useCallback((node: unknown) => {
            if (typeof initialRef.current === 'function') initialRef.current(node);
        }, []);
        return React.createElement(View, { ...props, ref: attach });
    });
    const makeSharedValue = (initialValue: unknown) => ({
        value: initialValue,
        get() {
            return this.value;
        },
        set(nextValue: unknown) {
            this.value = typeof nextValue === 'function' ? nextValue(this.value) : nextValue;
        },
    });
    return {
        __esModule: true,
        default: {
            createAnimatedComponent:
                () =>
                ({ testID, ...props }: Record<string, unknown>) =>
                    React.createElement(View, { ...props, testID }, React.createElement(FlatList, { ...props, testID: `${String(testID)}-native` })),
            View: AnimatedView,
            FlatList: ({ testID, ...props }: Record<string, unknown>) =>
                React.createElement(View, { ...props, testID }, React.createElement(FlatList, { ...props, testID: `${String(testID)}-native` })),
        },
        scrollTo: jest.fn((_ref, _x, y) => {
            mockScrollOffset = y;
        }),
        cancelAnimation: jest.fn(),
        measure: (ref: { current: { props?: { testID?: string } } }) => mockMeasure(ref.current?.props?.testID),
        Easing: { out: (value: unknown) => value, cubic: 'cubic', linear: 'linear' },
        useAnimatedRef: () => {
            const holder = React.useRef(null);
            if (!holder.current) {
                const ref = (node: unknown) => {
                    if (node) ref.current = node;
                    return mockMissingNativeRef ? null : {};
                };
                ref.current = null as unknown;
                holder.current = ref;
            }
            return holder.current;
        },
        useAnimatedScrollHandler: (callback: (event: unknown) => void) => (event: { nativeEvent: unknown }) => {
            mockScrollOffset = (event.nativeEvent as { contentOffset: { y: number } }).contentOffset.y;
            callback(event.nativeEvent);
        },
        useFrameCallback: (callback: (frame: { timeSincePreviousFrame: number }) => void) => {
            const latest = React.useRef(callback);
            latest.current = callback;
            React.useEffect(() => {
                const frame = (event: { timeSincePreviousFrame: number }) => latest.current(event);
                mockFrameCallbacks.add(frame);
                return () => mockFrameCallbacks.delete(frame);
            }, []);
        },
        useAnimatedStyle: (factory: () => Record<string, unknown>) =>
            Object.defineProperties({}, Object.fromEntries(Object.keys(factory()).map(key => [key, { enumerable: true, get: () => factory()[key] }]))),
        useSharedValue: (initialValue: unknown) => React.useRef(makeSharedValue(initialValue)).current,
        withTiming: (value: unknown, _config: unknown, callback?: (finished: boolean) => void) => {
            if (callback) mockAnimationCallbacks.push(callback);
            return value;
        },
    };
});
jest.mock('react-native-gesture-handler', () => {
    const React = jest.requireActual('react');

    const Pan = () => {
        const callbacks: Record<string, (...args: unknown[]) => unknown> = {};
        const config: Record<string, unknown> = {};
        const gesture = {
            callbacks,
            config,
            enabled: (value: boolean) => {
                config.enabled = value;
                return gesture;
            },
            activateAfterLongPress: (value: number) => {
                config.longPressDelay = value;
                return gesture;
            },
            failOffsetX: (value: number[]) => {
                config.failOffsetX = value;
                return gesture;
            },
            failOffsetY: (value: number[]) => {
                config.failOffsetY = value;
                return gesture;
            },
            shouldCancelWhenOutside: (value: boolean) => {
                config.shouldCancelWhenOutside = value;
                return gesture;
            },
            maxPointers: (value: number) => {
                config.maxPointers = value;
                return gesture;
            },
            blocksExternalGesture: () => gesture,
            onTouchesDown: (callback: (...args: unknown[]) => unknown) => {
                callbacks.touchesDown = callback;
                return gesture;
            },
            onTouchesCancelled: (callback: (...args: unknown[]) => unknown) => {
                callbacks.cancelled = callback;
                return gesture;
            },
            onStart: (callback: (...args: unknown[]) => unknown) => {
                callbacks.start = callback;
                return gesture;
            },
            onUpdate: (callback: (...args: unknown[]) => unknown) => {
                callbacks.update = callback;
                return gesture;
            },
            onFinalize: (callback: (...args: unknown[]) => unknown) => {
                callbacks.finalize = callback;
                return gesture;
            },
        };
        return gesture;
    };

    return {
        Gesture: { Pan, Native: () => ({ ...Pan(), native: true }) },
        GestureDetector: ({ children, gesture }: { children: ReactElement; gesture: ReturnType<typeof Pan> & { native?: boolean } }) =>
            gesture.native
                ? children
                : React.cloneElement(children, {
                      dragGestureConfig: gesture.config,
                      onGestureTouchesDown: (event: unknown) => gesture.callbacks.touchesDown?.(event, { fail: jest.fn() }),
                      onGestureCancelled: () => gesture.callbacks.cancelled?.(),
                      onGestureStart: () => gesture.callbacks.start?.(),
                      onGestureUpdate: (event: unknown) => gesture.callbacks.update?.(event),
                      onGestureFinalize: ({ event, success }: { event: unknown; success: boolean }) => gesture.callbacks.finalize?.(event, success),
                  }),
    };
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

const reorderedDraft = (current: LocalMediaImportDraft, ids: readonly string[]): LocalMediaImportDraft => ({
    ...current,
    updatedAt: current.updatedAt + 1,
    items: ids.map((id, position) => ({ ...current.items.find(item => item.id === id)!, position })),
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
        reorderItems: jest.fn().mockImplementation(async (_draft, ids) => ({ status: 'updated', draft: reorderedDraft(current, ids) })),
        confirm: jest.fn().mockResolvedValue({ status: 'updated', draft: { ...current, confirmedAt: 20 } }),
        reload: jest.fn().mockResolvedValue(current),
    };
}

function StatefulPanel({ initialDraft, reviewer }: { initialDraft: LocalMediaImportDraft; reviewer: ReviewLocalMediaImportController }) {
    const [current, setCurrent] = useState(initialDraft);
    return <LocalMediaReviewPanel draft={current} controller={reviewer} onDraftChange={next => next && setCurrent(next)} />;
}

function mockMeasure(testID?: string) {
    if (mockMissingNativeRef) throw new Error('Value is null, expected an Object');
    if (mockRejectLanding) return null;
    if (testID === 'review-sortable-viewport') return { pageX: 0, pageY: 0, width: 360, height: 400 };
    if (!testID?.startsWith('review-sortable-item-')) return null;
    const list = screen.queryByTestId('local-media-review-list-grid') ?? screen.getByTestId('local-media-review-list-list');
    const index = list.props.data.findIndex((item: { id: string }) => testID === `review-sortable-item-${item.id}`);
    const style = StyleSheet.flatten(screen.getByTestId(testID).props.style);
    return {
        pageX: (index % list.props.numColumns) * (style.width + 8),
        pageY: Math.floor(index / list.props.numColumns) * (style.minHeight + 8) - mockScrollOffset,
        width: style.width,
        height: style.minHeight,
    };
}

function finishMotion(finished = true) {
    act(() => {
        mockAnimationCallbacks.splice(0).forEach(callback => callback(finished));
    });
    act(() => mockFrameCallbacks.forEach(frame => frame({ timeSincePreviousFrame: 16 })));
}

function fireDrag(handle: ReturnType<typeof screen.getByTestId>, event: string, data?: unknown) {
    const viewport = screen.getByTestId('review-sortable-viewport');
    if (event === 'gestureStart') {
        const id = handle.props.testID.replace('review-drag-handle-', '');
        const list = screen.queryByTestId('local-media-review-list-grid') ?? screen.getByTestId('local-media-review-list-list');
        const index = list.props.data.findIndex((item: { id: string }) => item.id === id);
        const style = StyleSheet.flatten(screen.getByTestId(`review-sortable-item-${id}`).props.style);
        fireEvent(viewport, 'gestureTouchesDown', {
            numberOfTouches: 1,
            allTouches: [
                {
                    x: (index % list.props.numColumns) * (style.width + 8) + 20,
                    y: Math.floor(index / list.props.numColumns) * (style.minHeight + 8) + 20 - mockScrollOffset,
                },
            ],
        });
    }
    fireEvent(viewport, event, data);
    if (event === 'gestureFinalize' && !mockDeferSettling) finishMotion();
}

describe('MOB-FEAT-043 page organization redesign', () => {
    beforeEach(async () => {
        mockDeferSettling = false;
        mockRejectLanding = false;
        mockMissingNativeRef = false;
        mockScrollOffset = 0;
        mockAnimationCallbacks.length = 0;
        await i18n.changeLanguage('pt-BR');
    });

    it.each(['Grade', 'Lista'])('waits for animation and native landing layout in %s, including reused cells', async mode => {
        mockDeferSettling = true;
        mockRejectLanding = true;
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        fireEvent.press(screen.getByRole('radio', { name: mode }));
        const listId = `local-media-review-list-${mode === 'Grade' ? 'grid' : 'list'}`;
        fireEvent(screen.getByTestId('review-sortable-viewport'), 'layout', { nativeEvent: { layout: { height: 400, width: 360 } } });
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        expect(StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).opacity).toBe(1);
        fireEvent(screen.getByTestId('review-drag-overlay', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { height: 242 } } });
        expect(StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1', { includeHiddenElements: true }).props.style).opacity).toBe(0);
        fireDrag(handle, 'gestureUpdate', { absoluteY: 200, translationX: mode === 'Grade' ? 200 : 0, translationY: mode === 'Lista' ? 200 : 0 });
        await act(async () => fireDrag(handle, 'gestureFinalize', { event: {}, success: true }));
        expect(reviewer.reorderItems).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId(listId).props.data[0].id).toBe('item-1');
        expect(screen.getByRole('radio', { name: 'Lista' }).props.accessibilityState.disabled).toBe(true);
        finishMotion();
        expect(screen.getByTestId(listId).props.data[0].id).toBe('item-2');
        expect(screen.getByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeTruthy();
        mockRejectLanding = false;
        finishMotion();
        expect(screen.queryByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeNull();
        expect(screen.getByRole('radio', { name: 'Lista' }).props.accessibilityState.disabled).toBe(false);
    });

    it('waits for a native shadow node instead of measuring a null animated ref', async () => {
        mockDeferSettling = true;
        const current = draft();
        render(<StatefulPanel initialDraft={current} reviewer={controller(current)} />);
        fireEvent(screen.getByTestId('review-sortable-viewport'), 'layout', { nativeEvent: { layout: { height: 400, width: 360 } } });
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 200, translationX: 200, translationY: 0 });
        await act(async () => fireDrag(handle, 'gestureFinalize', { event: {}, success: true }));
        mockMissingNativeRef = true;
        expect(() => finishMotion()).not.toThrow();
        expect(screen.getByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeTruthy();
        mockMissingNativeRef = false;
        finishMotion();
        expect(screen.queryByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeNull();
    });

    it('retargets a failed drop to the restored slot before removing the floating item', async () => {
        mockDeferSettling = true;
        mockRejectLanding = true;
        const current = draft();
        const reviewer = controller(current);
        jest.mocked(reviewer.reorderItems).mockRejectedValueOnce(new Error('storage'));
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        fireEvent(screen.getByTestId('review-sortable-viewport'), 'layout', { nativeEvent: { layout: { height: 400, width: 360 } } });
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 200, translationX: 200, translationY: 0 });
        await act(async () => fireDrag(handle, 'gestureFinalize', { event: {}, success: true }));
        finishMotion();
        await waitFor(() => expect(reviewer.reload).toHaveBeenCalledTimes(1));
        finishMotion();
        const overlayStyle = StyleSheet.flatten(screen.getByTestId('review-drag-overlay', { includeHiddenElements: true }).props.style);
        expect(overlayStyle.transform[0].translateX).toBe(0);
        expect(reviewer.reorderItems).toHaveBeenCalledTimes(1);
        mockRejectLanding = false;
        finishMotion();
        expect(screen.queryByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeNull();
    });

    it('cancels on a second finger and ignores a subsequent successful finalize', () => {
        mockDeferSettling = true;
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 200, translationX: 200, translationY: 0 });
        fireEvent(screen.getByTestId('review-sortable-viewport'), 'gestureTouchesDown', { numberOfTouches: 2, allTouches: [] });
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });
        expect(reviewer.reorderItems).not.toHaveBeenCalled();
        finishMotion();
        expect(screen.queryByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeNull();
    });

    it('invalidates cancelled animation callbacks on interruption', () => {
        mockDeferSettling = true;
        const subscribe = jest.spyOn(AppState, 'addEventListener');
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });
        const stale = [...mockAnimationCallbacks];
        finishMotion(false);
        const listener = subscribe.mock.calls.find(([event]) => event === 'change')![1];
        act(() => listener('background'));
        act(() => stale.forEach(callback => callback(true)));
        expect(screen.queryByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeNull();
        expect(reviewer.reorderItems).not.toHaveBeenCalled();
        expect(screen.getByRole('radio', { name: 'Lista' }).props.accessibilityState.disabled).toBe(false);
    });

    it('invalidates a pending commit when the layout is replaced before the RN callback runs', () => {
        mockDeferSettling = true;
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 200, translationX: 200, translationY: 0 });
        let pending = () => undefined;
        jest.mocked(scheduleOnRN).mockImplementationOnce((callback, ...args) => {
            pending = () => (callback as (...values: unknown[]) => undefined)(...args);
        });
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });
        fireEvent(screen.getByTestId('review-sortable-container'), 'layout', { nativeEvent: { layout: { height: 400, width: 720 } } });
        act(pending);
        finishMotion();
        expect(reviewer.reorderItems).not.toHaveBeenCalled();
        expect(screen.queryByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeNull();
    });

    it('keeps the overlay and viewport recognizer operating across a long scroll', () => {
        mockDeferSettling = true;
        const current = draft(100);
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        const viewport = screen.getByTestId('review-sortable-viewport');
        fireDrag(handle, 'gestureStart');
        fireEvent.scroll(screen.getByTestId('local-media-review-list-grid'), { nativeEvent: { contentOffset: { x: 0, y: 4000 } } });
        fireEvent(viewport, 'gestureUpdate', { absoluteY: 200, translationX: 0, translationY: 100 });
        expect(screen.getByTestId('review-drag-overlay', { includeHiddenElements: true })).toBeTruthy();
        expect(viewport.props.dragGestureConfig.longPressDelay).toBe(200);
        fireEvent(viewport, 'gestureFinalize', { event: {}, success: true });
        expect(reviewer.reorderItems).toHaveBeenCalledTimes(1);
        const ids = jest.mocked(reviewer.reorderItems).mock.calls[0][1];
        expect(ids.indexOf('item-1')).toBeGreaterThan(8);
        expect(new Set(ids).size).toBe(100);
    });

    it.each(['light', 'dark'] as const)('keeps the contextual delete icon white in the %s theme', scheme => {
        render(
            <ThemeProvider initialOverride={scheme}>
                <LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={jest.fn()} />
            </ThemeProvider>,
        );
        fireEvent.press(screen.getByRole('button', { name: 'Abrir opções da página 1 de 3' }));
        expect(screen.getByTestId('icon-trash-outline', { includeHiddenElements: true }).props.color).toBe('#ffffff');
    });

    it('updates shifted slots and the indicator without rerendering card content or scheduling JS callbacks', () => {
        const current = draft();
        const renderMeta = jest.fn(() => <Text>estado</Text>);
        render(<LocalMediaReviewPanel draft={current} controller={controller(current)} onDraftChange={jest.fn()} renderItemMeta={renderMeta} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        renderMeta.mockClear();
        jest.mocked(scheduleOnRN).mockClear();
        const width = StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).width;
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: width + 8, translationY: 0 });
        expect(StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-2').props.style).transform[0].translateX).toBe(-(width + 8));
        expect(StyleSheet.flatten(screen.getByTestId('review-drop-indicator', { includeHiddenElements: true }).props.style).opacity).toBe(1);
        expect(StyleSheet.flatten(screen.getByTestId('review-item-item-2').props.style).borderWidth).toBe(1);
        expect(renderMeta).not.toHaveBeenCalled();
        expect(scheduleOnRN).not.toHaveBeenCalled();
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });
    });

    it('auto-scrolls with a stationary finger and stops immediately after cancellation', () => {
        const current = draft(20);
        const reviewer = controller(current);
        render(<LocalMediaReviewPanel draft={current} controller={reviewer} onDraftChange={jest.fn()} />);
        fireEvent(screen.getByTestId('review-sortable-viewport'), 'layout', { nativeEvent: { layout: { height: 400, width: 360 } } });
        fireEvent(screen.getByTestId('local-media-review-list-grid'), 'contentSizeChange', 360, 3000);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 390, translationX: 0, translationY: 300 });
        act(() => mockFrameCallbacks.forEach(frame => frame({ timeSincePreviousFrame: 16 })));
        expect(scrollTo).toHaveBeenCalledWith(expect.anything(), 0, expect.closeTo(7.68 * (46 / 56) ** 2), false);
        expect(StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).transform[1].translateY).toBeCloseTo(
            300 + 7.68 * (46 / 56) ** 2,
        );
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });
        jest.mocked(scrollTo).mockClear();
        act(() => mockFrameCallbacks.forEach(frame => frame({ timeSincePreviousFrame: 16 })));
        expect(scrollTo).not.toHaveBeenCalled();
        expect(reviewer.reorderItems).not.toHaveBeenCalled();
    });

    it('starts a second drag at the current scroll offset and ignores duplicate finalize events', async () => {
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });
        fireEvent.scroll(screen.getByTestId('local-media-review-list-grid'), { nativeEvent: { contentOffset: { x: 0, y: 500 } } });
        fireDrag(handle, 'gestureStart');
        const width = StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).width;
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: width + 8, translationY: 0 });
        expect(StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).transform[1].translateY).toBe(0);
        await act(async () => {
            fireDrag(handle, 'gestureFinalize', { event: {}, success: true });
            fireDrag(handle, 'gestureFinalize', { event: {}, success: true });
        });
        expect(reviewer.reorderItems).toHaveBeenCalledTimes(1);
        expect(reviewer.reorderItems).toHaveBeenCalledWith(current, ['item-2', 'item-1', 'item-3']);
    });

    it('cancels an active drag before replacing the layout after resize', () => {
        const current = draft();
        const reviewer = controller(current);
        render(<LocalMediaReviewPanel draft={current} controller={reviewer} onDraftChange={jest.fn()} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: 0, translationY: 500 });
        fireEvent(screen.getByTestId('review-sortable-container'), 'layout', { nativeEvent: { layout: { height: 400, width: 720 } } });
        expect(reviewer.reorderItems).not.toHaveBeenCalled();
        expect(screen.getByTestId('local-media-review-list-grid').props.scrollEnabled).toBe(true);
        expect(screen.getByRole('radio', { name: 'Grade' }).props.accessibilityState.disabled).toBe(false);
    });

    it('keeps translation feedback but removes decorative motion when reduce motion is enabled', () => {
        const current = draft();
        render(
            <ThemeProvider reduceMotion>
                <LocalMediaReviewPanel draft={current} controller={controller(current)} onDraftChange={jest.fn()} />
            </ThemeProvider>,
        );
        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: 30, translationY: 40 });
        expect(StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).transform).toEqual([
            { translateX: 30 },
            { translateY: 40 },
            { scale: 1 },
        ]);
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });
    });

    it('renders the minimal two-column grid with 3:4 images and no visible reorder controls', () => {
        render(<LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={jest.fn()} />);

        const list = screen.getByTestId('local-media-review-list-grid');
        expect(list.props.numColumns).toBe(2);
        expect(REVIEW_DRAG_LONG_PRESS_MS).toBe(200);
        expect(screen.getByTestId('review-sortable-viewport').props.dragGestureConfig).toEqual(
            expect.objectContaining({ enabled: true, failOffsetX: [-32, 32], failOffsetY: [-32, 32], longPressDelay: 200, shouldCancelWhenOutside: false }),
        );
        expect(screen.getByRole('radio', { name: 'Grade' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByTestId('review-image-item-1').props.style).toEqual(expect.objectContaining({ aspectRatio: 0.75, width: '100%' }));
        expect(screen.queryByText(/Página 1 de 3|Possível duplicata/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Remover página 1' })).toBeNull();
        expect(screen.queryByLabelText(/arrastar página/i)).toBeNull();
        expect(screen.queryByLabelText(/mover página 1 para (antes|depois)/i)).toBeNull();
        expect(screen.queryByText('Excluir')).toBeNull();
        expect(screen.getByText('Toque e segure uma imagem; depois arraste para reordenar')).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Abrir opções da página 1 de 3' }));
        expect(screen.getByTestId('review-image-actions-sheet')).toBeOnTheScreen();
        expect(screen.getByText('Página 1 de 3')).toBeOnTheScreen();
        expect(screen.getByText('Possível duplicata')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Visualizar imagem' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Excluir' })).toBeOnTheScreen();
    });

    it('uses the shared segmented control and switches to the single-column list without changing order', () => {
        render(<LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={jest.fn()} renderItemMeta={() => <Text>aguardando</Text>} />);

        fireEvent.press(screen.getByRole('radio', { name: 'Lista' }));

        expect(screen.getByRole('radio', { name: 'Lista' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByTestId('local-media-review-list-list').props.numColumns).toBe(1);
        expect(screen.getByTestId('local-media-review-list-list').props.initialNumToRender).toBe(6);
        expect(screen.getByText('Página 1 de 3')).toBeOnTheScreen();
        expect(screen.getByText('Página 3 de 3')).toBeOnTheScreen();
        expect(screen.getAllByText('aguardando')).toHaveLength(3);
        expect(screen.getByTestId('review-status-item-1')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Remover página 1' })).toBeOnTheScreen();
        const deleteSurfaceStyle = StyleSheet.flatten(screen.getByTestId('review-delete-surface-1').props.style);
        expect(deleteSurfaceStyle).toEqual(expect.objectContaining({ alignSelf: 'flex-start', justifyContent: 'center', padding: 4 }));
        expect(deleteSurfaceStyle.height).toBeGreaterThanOrEqual(44);
        expect(deleteSurfaceStyle.width).toBe(deleteSurfaceStyle.height);
    });

    it('keeps bounded virtualization for 100 images and resolves list, two- and four-column layouts', () => {
        const largeDraft = draft(100);
        render(<LocalMediaReviewPanel draft={largeDraft} controller={controller(largeDraft)} onDraftChange={jest.fn()} />);

        const list = screen.getByTestId('local-media-review-list-grid');
        expect(list.props.initialNumToRender).toBe(8);
        expect(list.props.maxToRenderPerBatch).toBe(8);
        expect(list.props.windowSize).toBe(5);
        expect(list.props.removeClippedSubviews).toBe(false);
        expect(list.props.ListFooterComponent).toBeTruthy();
        expect(resolveReviewColumnCount('list', 4)).toBe(1);
        expect(resolveReviewColumnCount('grid', 2)).toBe(2);
        expect(resolveReviewColumnCount('grid', 4)).toBe(4);
    });

    it.each(['Grade', 'Lista'])('keeps iOS clipping disabled through cancel and reorder in %s', async mode => {
        const current = draft(100);
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        fireEvent.press(screen.getByRole('radio', { name: mode }));
        const listId = `local-media-review-list-${mode === 'Grade' ? 'grid' : 'list'}`;
        const expectSafeList = () => {
            const list = screen.getByTestId(listId);
            expect(list.props.removeClippedSubviews).toBe(false);
            expect(list.props.windowSize).toBe(5);
            expect(list.props.maxToRenderPerBatch).toBe(8);
        };
        expectSafeList();

        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 390, translationX: 0, translationY: 300 });
        expectSafeList();
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });
        expectSafeList();
        expect(reviewer.reorderItems).not.toHaveBeenCalled();

        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 390, translationX: 0, translationY: 300 });
        await act(async () => fireDrag(handle, 'gestureFinalize', { event: {}, success: true }));
        expectSafeList();
        expect(reviewer.reorderItems).toHaveBeenCalledTimes(1);
    });

    it('applies an arbitrary optimistic reorder and persists it exactly once', async () => {
        let resolveReorder!: (outcome: ReviewLocalMediaImportOutcome) => void;
        const current = draft();
        const reviewer = controller(current);
        jest.mocked(reviewer.reorderItems).mockReturnValueOnce(new Promise(resolve => (resolveReorder = resolve)));
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-3');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: 0, translationY: -500 });
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });

        expect(screen.getByTestId('local-media-review-list-grid').props.data.map((item: { id: string }) => item.id)).toEqual(['item-3', 'item-1', 'item-2']);
        expect(reviewer.reorderItems).toHaveBeenCalledTimes(1);
        expect(reviewer.reorderItems).toHaveBeenCalledWith(current, ['item-3', 'item-1', 'item-2']);
        expect(screen.getByRole('radio', { name: 'Grade' }).props.accessibilityState.disabled).toBe(true);
        expect(screen.getByTestId('review-sortable-viewport').props.dragGestureConfig.enabled).toBe(false);

        await act(async () => resolveReorder({ status: 'updated', draft: reorderedDraft(current, ['item-3', 'item-1', 'item-2']) }));
        await waitFor(() => expect(screen.getByRole('radio', { name: 'Grade' }).props.accessibilityState.disabled).toBe(false));
    });

    it('moves the intervening slot during drag and persists the final order once', async () => {
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');

        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: 0, translationY: 500 });
        const shiftedItemStyle = StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-2').props.style);
        expect(shiftedItemStyle.transform).toEqual(expect.arrayContaining([expect.objectContaining({ translateX: expect.any(Number) })]));
        expect(shiftedItemStyle.transform[0].translateX).toBeLessThan(0);
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });

        await waitFor(() => expect(reviewer.reorderItems).toHaveBeenCalledTimes(1));
        expect(reviewer.reorderItems).toHaveBeenCalledWith(current, ['item-2', 'item-3', 'item-1']);
    });

    it('derives the destination directly from the real horizontal drag distance', async () => {
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');
        const itemWidth = StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).width;

        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: itemWidth + 8, translationY: 0 });
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });

        await waitFor(() => expect(reviewer.reorderItems).toHaveBeenCalledTimes(1));
        expect(reviewer.reorderItems).toHaveBeenCalledWith(current, ['item-2', 'item-1', 'item-3']);
    });

    it('does not commit a cancelled gesture', () => {
        const current = draft();
        const reviewer = controller(current);
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');

        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: 0, translationY: 500 });
        fireDrag(handle, 'gestureFinalize', { event: {}, success: false });

        expect(reviewer.reorderItems).not.toHaveBeenCalled();
    });

    it('restores the last persisted draft and exposes retry when persistence fails', async () => {
        const current = draft();
        const reviewer = controller(current);
        jest.mocked(reviewer.reorderItems).mockRejectedValueOnce(new Error('storage'));
        render(<StatefulPanel initialDraft={current} reviewer={reviewer} />);

        const handle = screen.getByTestId('review-drag-handle-item-1');
        const itemWidth = StyleSheet.flatten(screen.getByTestId('review-sortable-item-item-1').props.style).width;
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureUpdate', { absoluteY: 300, translationX: itemWidth + 8, translationY: 0 });
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });

        await waitFor(() => expect(screen.getByText('A alteração não pôde ser salva. O último estado seguro foi restaurado.')).toBeOnTheScreen());
        expect(screen.getByTestId('local-media-review-list-grid').props.data.map((item: { id: string }) => item.id)).toEqual(['item-1', 'item-2', 'item-3']);
        expect(reviewer.reload).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
        await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' })));
        await waitFor(() => expect(reviewer.reorderItems).toHaveBeenCalledTimes(2));
    });

    it('does not persist when a drag ends in the original position', () => {
        const current = draft();
        const reviewer = controller(current);
        render(<LocalMediaReviewPanel draft={current} controller={reviewer} onDraftChange={jest.fn()} />);

        const handle = screen.getByTestId('review-drag-handle-item-1');
        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });

        expect(reviewer.reorderItems).not.toHaveBeenCalled();
    });

    it('does not open image actions when the press is released immediately after dragging', () => {
        const current = draft();
        render(<LocalMediaReviewPanel draft={current} controller={controller(current)} onDraftChange={jest.fn()} />);
        const handle = screen.getByTestId('review-drag-handle-item-1');

        fireDrag(handle, 'gestureStart');
        fireDrag(handle, 'gestureFinalize', { event: {}, success: true });
        fireEvent.press(screen.getByTestId('review-image-item-1'));

        expect(screen.queryByTestId('review-image-actions-sheet')).toBeNull();
        expect(screen.queryByTestId('local-media-preview-modal')).toBeNull();
    });

    it('moves an item to an arbitrary valid index without mutating the source', () => {
        const source = ['a', 'b', 'c', 'd'];

        expect(reorderReviewItems(source, 0, 3)).toEqual(['b', 'c', 'd', 'a']);
        expect(reorderReviewItems(source, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
        expect(reorderReviewItems(source, 2, 2)).toEqual(source);
        expect(source).toEqual(['a', 'b', 'c', 'd']);
    });

    it('resolves direct drag distances for list and multi-column layouts', () => {
        expect(
            resolveReviewDropIndex({ fromIndex: 0, itemCount: 4, columnCount: 1, itemWidth: 360, gap: 8, rowPitch: 150, translation: { x: 0, y: 150 } }),
        ).toBe(1);
        expect(
            resolveReviewDropIndex({ fromIndex: 0, itemCount: 4, columnCount: 2, itemWidth: 176, gap: 8, rowPitch: 150, translation: { x: 185, y: 0 } }),
        ).toBe(1);
        expect(
            resolveReviewDropIndex({ fromIndex: 0, itemCount: 8, columnCount: 4, itemWidth: 100, gap: 8, rowPitch: 150, translation: { x: 0, y: 145 } }),
        ).toBe(4);
        expect(resolveReviewItemShift({ index: 1, fromIndex: 0, toIndex: 2, columnCount: 2, itemWidth: 176, gap: 8, rowPitch: 242.66666666666666 })).toEqual({
            x: -184,
            y: 0,
        });
        expect(resolveReviewItemShift({ index: 1, fromIndex: 2, toIndex: 0, columnCount: 2, itemWidth: 176, gap: 8, rowPitch: 242.66666666666666 })).toEqual({
            x: -184,
            y: 242.66666666666666,
        });
    });

    it('offers screen-reader move actions on the image while keeping short tap for preview', async () => {
        const reviewer = controller();
        render(<LocalMediaReviewPanel draft={draft()} controller={reviewer} onDraftChange={jest.fn()} />);
        const image = screen.getByTestId('review-image-item-1');

        expect(image.props.accessibilityActions).toEqual([{ name: 'moveLater', label: 'Mover página 1 para depois' }]);
        fireEvent(image, 'accessibilityAction', { nativeEvent: { actionName: 'moveLater' } });
        await waitFor(() => expect(reviewer.moveItem).toHaveBeenCalledWith(expect.anything(), 'item-1', 1));
        await waitFor(() => expect(screen.getByRole('radio', { name: 'Grade' }).props.accessibilityState.disabled).toBe(false));

        fireEvent.press(screen.getByRole('button', { name: 'Abrir opções da página 2 de 3' }));
        fireEvent.press(screen.getByRole('button', { name: 'Visualizar imagem' }));
        expect(screen.getByTestId('local-media-preview-modal')).toBeOnTheScreen();
    });

    it('opens and closes the shared private page-sheet preview inside a safe area', () => {
        const onDraftChange = jest.fn();
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
                <LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={onDraftChange} />
            </SafeAreaProvider>,
        );
        fireEvent.press(screen.getByRole('button', { name: 'Abrir opções da página 2 de 3' }));
        fireEvent.press(screen.getByRole('button', { name: 'Visualizar imagem' }));

        expect(screen.getByText('Visualizando página 2 de 3')).toBeOnTheScreen();
        expect(screen.getByRole('header', { name: 'Visualizar imagem' })).toBeOnTheScreen();
        expect(screen.getByLabelText('Imagem ampliada da página 2 de 3')).toBeOnTheScreen();
        expect(screen.queryByText(/file:\/\/|item-2/)).toBeNull();
        expect(screen.getByTestId('local-media-preview-modal').props.presentationStyle).toBe('pageSheet');
        expect(screen.UNSAFE_getByType(SafeAreaView)).toBeTruthy();
        fireEvent.press(screen.getAllByRole('button', { name: 'Fechar' })[0]);
        expect(screen.queryByTestId('local-media-preview-modal')).toBeNull();

        fireEvent.press(screen.getByRole('radio', { name: 'Lista' }));
        fireEvent.press(screen.getByRole('button', { name: 'Ampliar página 2 de 3' }));
        expect(screen.getByRole('header', { name: 'Visualizar imagem' })).toBeOnTheScreen();
        fireEvent.press(screen.getAllByRole('button', { name: 'Fechar' })[1]);
        expect(screen.queryByTestId('local-media-preview-modal')).toBeNull();
        expect(onDraftChange).not.toHaveBeenCalled();
    });

    it.each([
        ['pt-BR', 'Grade', 'Lista', 'Toque e segure uma imagem; depois arraste para reordenar', 'Remover página 1'],
        ['en-US', 'Grid', 'List', 'Touch and hold an image, then drag to reorder', 'Remove page 1'],
        ['es-ES', 'Cuadrícula', 'Lista', 'Mantén pulsada una imagen y arrástrala para reordenar', 'Eliminar la página 1'],
    ])('localizes both view modes, drag guidance and deletion in %s', async (language, grid, list, hint, remove) => {
        await i18n.changeLanguage(language);
        render(<LocalMediaReviewPanel draft={draft()} controller={controller()} onDraftChange={jest.fn()} />);
        expect(screen.getByRole('radio', { name: grid })).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: list })).toBeOnTheScreen();
        expect(screen.getByText(hint)).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('radio', { name: list }));
        expect(screen.getByRole('button', { name: remove })).toBeOnTheScreen();
    });
});

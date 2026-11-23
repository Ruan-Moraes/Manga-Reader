import { useState } from 'react';
import { Dimensions, FlatList } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_TEXT_READER_PREFERENCES, type TextReaderPreferences } from '@/entities/user-setting';
import { ThemeProvider } from '@/shared/theme';

import type { ReaderLocation, TextFlowDocument } from '../../model/contentReader';
import { TextViewport } from '../TextViewport';

const document: TextFlowDocument = {
    kind: 'TEXT_FLOW',
    id: 'test',
    title: 'Test',
    blocks: [
        { id: 'one', type: 'paragraph', text: 'a'.repeat(100) },
        { id: 'two', type: 'paragraph', text: 'b'.repeat(1000) },
    ],
};
const layout = (y: number, height: number) => ({ nativeEvent: { layout: { x: 0, y, width: 320, height } } });
const scroll = (y: number) => ({
    nativeEvent: { contentOffset: { x: 0, y }, contentSize: { width: 320, height: 2200 }, layoutMeasurement: { width: 320, height: 400 } },
});
function Harness({
    preferences = DEFAULT_TEXT_READER_PREFERENCES,
    progress = jest.fn(),
    initial = { itemId: 'one', index: 0 },
    content = document,
}: {
    preferences?: TextReaderPreferences;
    progress?: (percent: number) => void;
    initial?: ReaderLocation;
    content?: TextFlowDocument;
}) {
    const [location, setLocation] = useState(initial);
    return (
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 600 }, insets: { top: 0, bottom: 0, left: 0, right: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <TextViewport document={content} location={location} preferences={preferences} onLocationChange={setLocation} onProgressChange={progress} />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

describe('MOB-FEAT-053 measured text viewport', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        Dimensions.set({ window: { width: 360, height: 600, scale: 2, fontScale: 1 }, screen: { width: 360, height: 600, scale: 2, fontScale: 1 } });
    });
    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });
    it.each([{ fontSize: 24 }, { fontFamily: 'SERIF' }, { lineSpacing: 'WIDE' }, { margins: 'WIDE' }] as Partial<TextReaderPreferences>[])(
        'keeps the paragraph fraction after changing %o without replacing the list',
        patch => {
            const move = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
            jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => undefined);
            const screen = render(<Harness />);
            const list = screen.getByTestId('reader-text-flow');
            fireEvent(list, 'layout', layout(0, 400));
            fireEvent(list, 'contentSizeChange', 320, 2200);
            fireEvent(screen.getByTestId('novel-cell-one'), 'layout', layout(16, 100));
            fireEvent(screen.getByTestId('novel-cell-two'), 'layout', layout(116, 1000));
            act(() => jest.advanceTimersByTime(20));
            fireEvent.scroll(list, scroll(600));
            fireEvent(list, 'scrollEndDrag', scroll(600));
            screen.rerender(<Harness preferences={{ ...DEFAULT_TEXT_READER_PREFERENCES, ...patch }} />);
            fireEvent(screen.getByTestId('novel-cell-one'), 'layout', layout(16, 200));
            fireEvent(screen.getByTestId('novel-cell-two'), 'layout', layout(216, 2000));
            act(() => jest.advanceTimersByTime(20));
            expect(move).toHaveBeenLastCalledWith({ offset: 1200, animated: false });
            expect(screen.getByTestId('reader-text-flow')).toBe(list);
        },
    );
    it('preserves position after orientation and system font scale change', () => {
        const move = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => undefined);
        const screen = render(<Harness initial={{ itemId: 'two', index: 1, itemOffsetRatio: 0.5 }} />);
        fireEvent(screen.getByTestId('novel-cell-two'), 'layout', layout(116, 1000));
        act(() => jest.advanceTimersByTime(20));
        act(() => Dimensions.set({ window: { width: 800, height: 360, scale: 2, fontScale: 2 }, screen: { width: 800, height: 360, scale: 2, fontScale: 2 } }));
        screen.rerender(<Harness preferences={{ ...DEFAULT_TEXT_READER_PREFERENCES }} />);
        fireEvent(screen.getByTestId('novel-cell-two'), 'layout', layout(216, 2000));
        act(() => jest.advanceTimersByTime(20));
        expect(move).toHaveBeenLastCalledWith({ offset: 1200, animated: false });
        expect(screen.getByTestId('reader-text-flow').props.contentContainerStyle.width).toBe(640);
    });
    it('retries an off-window target by average length and cancels when dragging', () => {
        const move = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        const index = jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => undefined);
        const content: TextFlowDocument = {
            ...document,
            blocks: Array.from({ length: 120 }, (_, n) => ({ id: `p${n}`, type: 'paragraph', text: 'Long paragraph' })),
        };
        const screen = render(<Harness content={content} initial={{ itemId: 'p100', index: 100, itemOffsetRatio: 0.5 }} />);
        const list = screen.getByTestId('reader-text-flow');
        act(() => jest.advanceTimersByTime(20));
        expect(index).toHaveBeenCalledWith({ index: 100, animated: false, viewOffset: 16 });
        fireEvent(list, 'scrollToIndexFailed', { index: 100, averageItemLength: 100, highestMeasuredFrameIndex: 7 });
        expect(move).toHaveBeenCalledWith({ offset: 9984, animated: false });
        fireEvent(list, 'layout', layout(0, 400));
        fireEvent(list, 'contentSizeChange', 320, 12000);
        for (let n = 0; n < 8; n += 1) fireEvent(screen.getByTestId(`novel-cell-p${n}`), 'layout', layout(16 + n * 100, 100));
        fireEvent.scroll(list, {
            nativeEvent: { contentOffset: { x: 0, y: 9984 }, contentSize: { width: 320, height: 12000 }, layoutMeasurement: { width: 320, height: 400 } },
        });
        act(() => jest.advanceTimersByTime(200));
        fireEvent(screen.getByTestId('novel-cell-p100'), 'layout', layout(10016, 200));
        act(() => jest.advanceTimersByTime(20));
        expect(move).toHaveBeenLastCalledWith({ offset: 10100, animated: false });
        fireEvent(list, 'scrollBeginDrag', scroll(9984));
        const before = index.mock.calls.length;
        act(() => jest.advanceTimersByTime(200));
        expect(index.mock.calls.length).toBe(before);
    });
    it('reports 100 for a chapter that fits and at the bottom of a long chapter', () => {
        const progress = jest.fn();
        jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        const screen = render(<Harness progress={progress} />);
        const list = screen.getByTestId('reader-text-flow');
        fireEvent(list, 'layout', layout(0, 400));
        fireEvent(list, 'contentSizeChange', 320, 300);
        fireEvent(screen.getByTestId('novel-cell-one'), 'layout', layout(16, 100));
        act(() => jest.advanceTimersByTime(20));
        expect(progress).toHaveBeenLastCalledWith(100);
        fireEvent(list, 'contentSizeChange', 320, 2200);
        fireEvent.scroll(list, scroll(0));
        expect(progress).toHaveBeenLastCalledWith(0);
        fireEvent.scroll(list, scroll(1800));
        expect(progress).toHaveBeenLastCalledWith(100);
    });
});

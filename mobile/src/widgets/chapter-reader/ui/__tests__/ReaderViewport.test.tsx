const mockImageRender = jest.fn();

jest.mock('expo-image', () => {
    const Image = (props: unknown) => {
        mockImageRender(props);
        return null;
    };
    Image.prefetch = jest.fn().mockResolvedValue(true);
    return { Image };
});

import { FlatList } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { ChapterPage } from '@/entities/chapter';
import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { ReaderViewport } from '../ReaderViewport';

const pages: ChapterPage[] = [
    { id: 'p1', order: 1, imageUrl: 'one', thumbnailUrl: 'one-t', width: 800, height: 1000 },
    { id: 'p2', order: 2, imageUrl: 'two', thumbnailUrl: 'two-t', width: 800, height: 1600 },
    { id: 'p3', order: 3, imageUrl: 'three', thumbnailUrl: 'three-t', width: 800, height: 900 },
];

describe('MOB-FEAT-005/AC-006/007/009 vertical logical viewport', () => {
    it('restores an unmounted page using dimensions and preserves offsets through fit changes', () => {
        const scrollTo = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        const input = Array.from({ length: 200 }, (_, index) => ({ ...pages[index % 3], id: `p${index + 1}` }));
        const onCurrentPageChange = jest.fn();
        const viewport = (fit: 'ORIGINAL' | 'HEIGHT') => (
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ReaderViewport
                    pages={input}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'VERTICAL', fit, gap: 16 }}
                    currentPage={100}
                    onCurrentPageChange={onCurrentPageChange}
                />
            </ThemeProvider>
        );
        const screen = render(viewport('ORIGINAL'));
        const expectedOffset = input.slice(0, 99).reduce((sum, page) => sum + page.height + 16, 0);
        expect(scrollTo).toHaveBeenLastCalledWith({ offset: expectedOffset, animated: false });
        const list = screen.UNSAFE_getByType(FlatList);
        expect(list.props.getItemLayout(input, 99)).toEqual({ index: 99, offset: expectedOffset, length: 1000 });
        expect(screen.queryByTestId('reader-page-p1')).toBeNull();
        expect(screen.getByTestId('reader-page-p100')).toBeTruthy();
        fireEvent(screen.getByTestId('reader-vertical'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 0, y: expectedOffset + 10 } } });
        expect(onCurrentPageChange).toHaveBeenLastCalledWith(100);
        screen.rerender(viewport('HEIGHT'));
        const layout = screen.UNSAFE_getByType(FlatList).props.getItemLayout(input, 99);
        expect(layout.offset).toBe(99 * (layout.length + 16));
        expect(scrollTo).toHaveBeenLastCalledWith({ offset: layout.offset, animated: false });
        scrollTo.mockRestore();
    });

    it('keeps logical position when a failed short page needs room for an accessible retry', () => {
        const scrollTo = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        mockImageRender.mockClear();
        const screen = render(
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ReaderViewport
                    pages={[{ ...pages[0], height: 20 }, pages[1]]}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'VERTICAL', fit: 'ORIGINAL', gap: 16 }}
                    currentPage={1}
                    onCurrentPageChange={jest.fn()}
                />
            </ThemeProvider>,
        );
        act(() => mockImageRender.mock.calls[0][0].onError());
        fireEvent(screen.getByTestId('reader-page-error-p1'), 'layout', { nativeEvent: { layout: { height: 360 } } });
        expect(screen.UNSAFE_getByType(FlatList).props.getItemLayout(null, 1).offset).toBe(376);
        expect(scrollTo).toHaveBeenLastCalledWith({ offset: 0, animated: false });
        fireEvent.press(screen.getByText(i18n.t('reader:actions.retry')));
        expect(screen.queryByTestId('reader-page-error-p1')).toBeNull();
        expect(screen.UNSAFE_getByType(FlatList).props.getItemLayout(null, 1).offset).toBe(36);
        expect(scrollTo).toHaveBeenLastCalledWith({ offset: 0, animated: false });
        scrollTo.mockRestore();
    });

    it('altera somente a superfície ao trocar o fundo', () => {
        const renderViewport = (background: 'DARK' | 'PAPER') => (
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ReaderViewport
                    pages={pages}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, background, mode: 'VERTICAL' }}
                    currentPage={1}
                    onCurrentPageChange={jest.fn()}
                />
            </ThemeProvider>
        );
        mockImageRender.mockClear();
        const screen = render(renderViewport('DARK'));
        const initialImageRenders = mockImageRender.mock.calls.length;

        screen.rerender(renderViewport('PAPER'));

        expect(initialImageRenders).toBe(pages.length);
        expect(mockImageRender).toHaveBeenCalledTimes(initialImageRenders);
        expect(screen.getByTestId('reader-vertical').props.style).toEqual(expect.objectContaining({ backgroundColor: '#EFEDE5' }));
    });
});

describe('MOB-PERF-002 logical page numbering', () => {
    it.each([10, 67, 200])('bounds page-array reads while rendering %i pages', count => {
        let reads = 0;
        const input = new Proxy(
            Array.from({ length: count }, (_, index) => ({ ...pages[0], id: `page-${index}`, order: index + 1 })),
            {
                get(target, key, receiver) {
                    if (typeof key === 'string' && /^\d+$/.test(key)) reads += 1;
                    return Reflect.get(target, key, receiver);
                },
            },
        );
        mockImageRender.mockClear();
        render(
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ReaderViewport
                    pages={input}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'VERTICAL', preload: 0 }}
                    currentPage={1}
                    onCurrentPageChange={jest.fn()}
                />
            </ThemeProvider>,
        );
        expect(mockImageRender.mock.calls.length).toBeGreaterThan(0);
        expect(mockImageRender.mock.calls.length).toBeLessThan(count);
        expect(reads).toBeLessThanOrEqual(count * 8);
    });

    it.each(['LTR', 'RTL'] as const)('keeps logical labels for double %s and the final odd page', direction => {
        const viewport = (currentPage: number, input = pages) => (
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ReaderViewport
                    pages={input}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'DOUBLE', direction, preload: 0 }}
                    currentPage={currentPage}
                    onCurrentPageChange={jest.fn()}
                />
            </ThemeProvider>
        );
        mockImageRender.mockClear();
        const screen = render(viewport(1));
        const order = direction === 'RTL' ? [2, 1] : [1, 2];
        expect(mockImageRender.mock.calls.map(([props]) => props.accessibilityLabel)).toEqual(
            order.map(page => i18n.t('reader:viewport.page', { page, total: 3 })),
        );
        mockImageRender.mockClear();
        screen.rerender(viewport(3));
        expect(mockImageRender.mock.calls.map(([props]) => props.accessibilityLabel)).toEqual([i18n.t('reader:viewport.page', { page: 3, total: 3 })]);
        mockImageRender.mockClear();
        screen.rerender(viewport(1, [pages[2]]));
        expect(mockImageRender.mock.calls.map(([props]) => props.accessibilityLabel)).toEqual([i18n.t('reader:viewport.page', { page: 1, total: 1 })]);
    });
});

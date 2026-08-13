jest.mock('expo-image', () => {
    const Image = () => null;
    Image.prefetch = jest.fn().mockResolvedValue(true);
    return { Image };
});

import { ScrollView } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import type { ChapterPage } from '@/src/entities/chapter';
import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import { ThemeProvider } from '@/src/shared/theme';

import { ReaderViewport } from '../ReaderViewport';

const pages: ChapterPage[] = [
    { id: 'p1', order: 1, imageUrl: 'one', thumbnailUrl: 'one-t', width: 800, height: 1000 },
    { id: 'p2', order: 2, imageUrl: 'two', thumbnailUrl: 'two-t', width: 800, height: 1600 },
    { id: 'p3', order: 3, imageUrl: 'three', thumbnailUrl: 'three-t', width: 800, height: 900 },
];

describe('MOB-FEAT-005/AC-006/007/009 vertical logical viewport', () => {
    it('restores the requested page and tracks variable layouts, gaps and reflow by identity', () => {
        const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => undefined);
        const onCurrentPageChange = jest.fn();
        const renderViewport = (currentPage: number) => (
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ReaderViewport
                    pages={pages}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'VERTICAL', gap: 16 }}
                    currentPage={currentPage}
                    onCurrentPageChange={onCurrentPageChange}
                />
            </ThemeProvider>
        );
        const screen = render(renderViewport(2));

        fireEvent(screen.getByTestId('reader-page-p1'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 800, height: 1000 } } });
        fireEvent(screen.getByTestId('reader-page-p2'), 'layout', { nativeEvent: { layout: { x: 0, y: 1016, width: 800, height: 1600 } } });
        fireEvent(screen.getByTestId('reader-page-p3'), 'layout', { nativeEvent: { layout: { x: 0, y: 2632, width: 800, height: 900 } } });
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 1016, animated: false });

        fireEvent(screen.getByTestId('reader-vertical'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 0, y: 1100 } } });
        expect(onCurrentPageChange).toHaveBeenLastCalledWith(2);

        screen.rerender(renderViewport(2));
        fireEvent(screen.getByTestId('reader-page-p2'), 'layout', { nativeEvent: { layout: { x: 0, y: 720, width: 1200, height: 900 } } });
        expect(scrollTo).toHaveBeenLastCalledWith({ y: 720, animated: false });
    });
});

import type { ReactNode } from 'react';

import { LibraryScreen } from './LibraryScreen';
import { ProfileScreen } from './ProfileScreen';
import { ReaderScreen } from './ReaderScreen';
import { TitleScreen } from './TitleScreen';

export { LibraryScreen } from './LibraryScreen';
export { ProfileScreen } from './ProfileScreen';
export { ReaderScreen } from './ReaderScreen';
export { TitleScreen } from './TitleScreen';
export { MiniPoster, MockSearch, ScreenHeader, useLandingText } from './shared';
export { useDragScroll } from './useDragScroll';

export type MockScreenName =
    | 'LibraryScreen'
    | 'TitleScreen'
    | 'ReaderScreen'
    | 'ProfileScreen';

export const MOCK_SCREENS: Record<MockScreenName, () => ReactNode> = {
    LibraryScreen,
    TitleScreen,
    ReaderScreen,
    ProfileScreen,
};

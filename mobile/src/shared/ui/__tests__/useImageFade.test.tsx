import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { useImageFade } from '../useImageFade';

const wrapper =
    (props: { animations?: boolean; reduceMotion?: boolean }) =>
    ({ children }: { children: ReactNode }) => (
        <ThemeProvider {...props} initialOverride="dark" waitForPlatform={false}>
            {children}
        </ThemeProvider>
    );

describe('useImageFade', () => {
    it('usa motion.base com animações ligadas', () => {
        expect(renderHook(useImageFade, { wrapper: wrapper({}) }).result.current).toBe(200);
    });

    it.each([{ animations: false }, { reduceMotion: true }])('sem fade com %o', props => {
        expect(renderHook(useImageFade, { wrapper: wrapper(props) }).result.current).toBeNull();
    });
});

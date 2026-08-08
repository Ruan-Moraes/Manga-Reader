import { useColorScheme } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ThemeProvider, useTheme } from '../ThemeProvider';
import { darkTokens, lightTokens } from '../tokens';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    default: jest.fn(),
}));

const mockedUseColorScheme = jest.mocked(useColorScheme);

describe('MOB-BASE-002 ThemeProvider', () => {
    it('segue o esquema escuro do sistema sem override', () => {
        mockedUseColorScheme.mockReturnValue('dark');
        const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>;

        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.colorScheme).toBe('dark');
        expect(result.current.tokens).toBe(darkTokens);
    });

    it('dá precedência ao override e comunica mudanças', () => {
        mockedUseColorScheme.mockReturnValue('dark');
        const onOverrideChange = jest.fn();
        const wrapper = ({ children }: PropsWithChildren) => (
            <ThemeProvider initialOverride="light" onOverrideChange={onOverrideChange}>
                {children}
            </ThemeProvider>
        );

        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.colorScheme).toBe('light');
        expect(result.current.tokens).toBe(lightTokens);

        act(() => result.current.setOverride(null));

        expect(onOverrideChange).toHaveBeenCalledWith(null);
        expect(result.current.colorScheme).toBe('dark');
    });
});

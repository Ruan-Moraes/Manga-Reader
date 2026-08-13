import { AccessibilityInfo, useColorScheme, useWindowDimensions, View } from 'react-native';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { darkHighContrastTokens } from '../appearance';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { darkTokens, lightTokens } from '../tokens';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    default: jest.fn(),
}));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(),
}));

const mockedUseColorScheme = jest.mocked(useColorScheme);
const mockedUseWindowDimensions = jest.mocked(useWindowDimensions);

describe('MOB-BASE-002 ThemeProvider', () => {
    beforeEach(() => {
        mockedUseWindowDimensions.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 400 });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('segue o esquema escuro do sistema sem override', () => {
        mockedUseColorScheme.mockReturnValue('dark');
        const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider waitForPlatform={false}>{children}</ThemeProvider>;

        const { result, rerender } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.colorScheme).toBe('dark');
        expect(result.current.tokens).toBe(darkTokens);

        mockedUseColorScheme.mockReturnValue('light');
        rerender(undefined);
        expect(result.current.colorScheme).toBe('light');
        expect(result.current.tokens).toBe(lightTokens);
    });

    it('dá precedência ao override e comunica mudanças', () => {
        mockedUseColorScheme.mockReturnValue('dark');
        const onOverrideChange = jest.fn();
        const wrapper = ({ children }: PropsWithChildren) => (
            <ThemeProvider initialOverride="light" onOverrideChange={onOverrideChange} waitForPlatform={false}>
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

    it('aguarda detecção nativa e reage a movimento, contraste e font scale durante a sessão', async () => {
        const handlers = new Map<string, (value: boolean) => void>();
        jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
        jest.spyOn(AccessibilityInfo, 'isHighTextContrastEnabled').mockResolvedValue(false);
        jest.spyOn(AccessibilityInfo, 'isDarkerSystemColorsEnabled').mockResolvedValue(false);
        jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((event, handler) => {
            handlers.set(event, handler as unknown as (value: boolean) => void);
            return { remove: jest.fn() } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
        });
        mockedUseColorScheme.mockReturnValue('dark');
        const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider waitForPlatform>{children}</ThemeProvider>;

        const { result, rerender } = renderHook(() => useTheme(), { wrapper });
        expect(result.current).toBeNull();
        await waitFor(() => expect(result.current).not.toBeNull());
        expect(result.current.decorativeMotionEnabled).toBe(true);

        act(() => handlers.get('reduceMotionChanged')?.(true));
        expect(result.current.effectiveReduceMotion).toBe(true);
        expect(result.current.decorativeMotionEnabled).toBe(false);

        act(() => handlers.get('highTextContrastChanged')?.(true));
        expect(result.current.effectiveHighContrast).toBe(true);
        expect(result.current.tokens).toBe(darkHighContrastTokens);

        mockedUseWindowDimensions.mockReturnValue({ fontScale: 1.6, height: 800, scale: 2, width: 400 });
        rerender(undefined);
        expect(result.current.fontScale).toBe(1.6);
    });

    it('não mantém o aplicativo em branco quando uma consulta nativa de acessibilidade não resolve', async () => {
        jest.useFakeTimers();
        const never = new Promise<boolean>(() => {});
        jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(never);
        jest.spyOn(AccessibilityInfo, 'isHighTextContrastEnabled').mockReturnValue(never);
        jest.spyOn(AccessibilityInfo, 'isDarkerSystemColorsEnabled').mockReturnValue(never);
        jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
        mockedUseColorScheme.mockReturnValue('light');

        render(
            <ThemeProvider waitForPlatform>
                <View testID="application" />
            </ThemeProvider>,
        );

        expect(screen.getByRole('progressbar')).toBeTruthy();
        expect(screen.queryByTestId('application')).toBeNull();

        await act(async () => {
            jest.advanceTimersByTime(1500);
            await Promise.resolve();
        });

        expect(screen.queryByRole('progressbar')).toBeNull();
        expect(screen.getByTestId('application')).toBeTruthy();
    });

    it('compõe a variante confortável com a escala de fonte nativa', () => {
        mockedUseWindowDimensions.mockReturnValue({ fontScale: 1.6, height: 800, scale: 2, width: 400 });
        const wrapper = ({ children }: PropsWithChildren) => (
            <ThemeProvider fontSize="COMFORTABLE" waitForPlatform={false}>
                {children}
            </ThemeProvider>
        );

        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.typography.h2).toBe(26);
        expect(result.current.textStyles.title.fontSize).toBe(26);
        expect(result.current.layout.screenGutter).toBe(20);
        expect(result.current.radii.card).toBe(16);
        expect(result.current.fontScale).toBe(1.6);
    });
});

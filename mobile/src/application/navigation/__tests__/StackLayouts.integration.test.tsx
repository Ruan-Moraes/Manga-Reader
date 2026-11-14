import { render } from '@testing-library/react-native';

import AuthLayout from '@/app/(auth)/_layout';
import PlatformTabsLayout from '@/app/platform/(tabs)/_layout';
import PlatformLayout from '@/app/platform/_layout';
import ReaderPreviewLayout from '@/app/reader-preview/_layout';
import ReaderLayout from '@/app/reader/_layout';
import SettingsLayout from '@/app/settings/_layout';
import { useTheme } from '@/shared/theme';

jest.mock('expo-router', () => {
    const Stack = jest.fn(() => null) as jest.Mock & { Screen: jest.Mock };
    const Tabs = jest.fn(() => null) as jest.Mock & { Screen: jest.Mock };

    Stack.Screen = jest.fn(() => null);
    Tabs.Screen = jest.fn(() => null);

    return { Stack, Tabs };
});
jest.mock('@/shared/theme', () => ({ useTheme: jest.fn() }));
jest.mock('@/shared/ui', () => ({ Icon: () => null }));

const { Stack: stack, Tabs: tabs } = jest.requireMock('expo-router') as { Stack: jest.Mock; Tabs: jest.Mock };

const mockTheme = (decorativeMotionEnabled: boolean) =>
    jest
        .mocked(useTheme)
        .mockReturnValue({ decorativeMotionEnabled, motion: { screen: 140, screenSlide: 220 }, tokens: { bg: '#000' } } as ReturnType<typeof useTheme>);

const lastScreenOptions = (navigator: jest.Mock) => navigator.mock.calls.at(-1)?.[0].screenOptions as Record<string, unknown>;

describe('MOB-FEAT-069 pilhas internas e abas', () => {
    it.each([
        ['Configurações', SettingsLayout],
        ['Auth', AuthLayout],
        ['Plataforma', PlatformLayout],
    ])('AC-003 %s vai mais fundo deslizando da direita, com gesto em tela inteira', (_name, Layout) => {
        mockTheme(true);
        render(<Layout />);
        expect(lastScreenOptions(stack)).toEqual(
            expect.objectContaining({ animation: 'simple_push', animationDuration: 220, fullScreenGestureEnabled: true, headerShown: false }),
        );

        mockTheme(false);
        render(<Layout />);
        expect(lastScreenOptions(stack)).toEqual(expect.objectContaining({ animation: 'none', fullScreenGestureEnabled: true }));
    });

    it.each([
        [true, 'fade'],
        [false, 'none'],
    ] as const)('AC-003 abas da plataforma com animações %s trocam com %s', (decorativeMotionEnabled, animation) => {
        mockTheme(decorativeMotionEnabled);
        render(<PlatformTabsLayout />);
        expect(lastScreenOptions(tabs).animation).toBe(animation);
    });

    it.each([
        ['leitor', ReaderLayout],
        ['prévia do leitor', ReaderPreviewLayout],
    ])('AC-004 pilha do %s mantém o gesto só pela borda', (_name, Layout) => {
        mockTheme(true);
        render(<Layout />);
        expect(lastScreenOptions(stack)).toEqual(expect.objectContaining({ animation: 'fade', fullScreenGestureEnabled: false, headerShown: false }));
    });
});

import { render } from '@testing-library/react-native';

import { useTheme } from '@/src/shared/theme';

import { RootNavigator } from '../RootNavigator';

jest.mock('expo-router', () => {
    const Stack = jest.fn(() => null) as jest.Mock & { Screen: jest.Mock };
    Stack.Screen = jest.fn(() => null);
    return { Stack };
});
jest.mock('@/src/shared/theme', () => ({ useTheme: jest.fn() }));

const stack = jest.requireMock('expo-router').Stack as jest.Mock;

describe('MOB-FEAT-002 navigation motion', () => {
    it.each([
        [true, 'fade'],
        [false, 'none'],
    ] as const)('resolve animação decorativa %s como %s', (decorativeMotionEnabled, animation) => {
        jest.mocked(useTheme).mockReturnValue({ decorativeMotionEnabled, tokens: { bg: '#000' } } as ReturnType<typeof useTheme>);
        render(<RootNavigator />);
        expect(stack.mock.calls.at(-1)?.[0].screenOptions.animation).toBe(animation);
    });

    it('registra settings e +not-found no mesmo navegador raiz', () => {
        jest.mocked(useTheme).mockReturnValue({ decorativeMotionEnabled: false, tokens: { bg: '#000' } } as ReturnType<typeof useTheme>);
        render(<RootNavigator />);
        const children = stack.mock.calls.at(-1)?.[0].children as React.ReactElement<{ name: string }>[];
        expect(children.map(child => child.props.name)).toEqual(expect.arrayContaining(['index', 'offline-translation', 'platform', 'settings', '+not-found']));
    });
});

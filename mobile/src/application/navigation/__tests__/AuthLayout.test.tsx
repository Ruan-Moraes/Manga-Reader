import { render } from '@testing-library/react-native';

import AuthLayout from '@/app/(auth)/_layout';
import { useTheme } from '@/src/shared/theme';

jest.mock('expo-router', () => {
    const Stack = jest.fn(() => null) as jest.Mock & { Screen: jest.Mock };
    Stack.Screen = jest.fn(() => null);
    return { Stack };
});
jest.mock('@/src/shared/theme', () => ({ useTheme: jest.fn() }));

const stack = jest.requireMock('expo-router').Stack as jest.Mock;

describe('MOB-FEAT-002 auth navigation motion', () => {
    it.each([
        [true, 'slide_from_right'],
        [false, 'none'],
    ] as const)('resolve animação decorativa %s como %s', (decorativeMotionEnabled, animation) => {
        jest.mocked(useTheme).mockReturnValue({ decorativeMotionEnabled, tokens: { bg: '#000' } } as ReturnType<typeof useTheme>);
        render(<AuthLayout />);
        expect(stack.mock.calls.at(-1)?.[0].screenOptions.animation).toBe(animation);
    });
});
